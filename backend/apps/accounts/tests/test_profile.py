import io
import os
import tempfile

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.repairs.models import RepairRequest

PW = "Str0ng-pass-123"
PHONE = "+996700123456"


def picture(width=800, height=600, fmt="PNG", name="photo.png"):
    buf = io.BytesIO()
    Image.new("RGB", (width, height), (30, 120, 200)).save(buf, fmt)
    return SimpleUploadedFile(name, buf.getvalue(), content_type=f"image/{fmt.lower()}")


class ProfileMediaTests(TestCase):
    def setUp(self):
        cache.clear()
        self.media = tempfile.TemporaryDirectory()
        self.addCleanup(self.media.cleanup)
        ctx = override_settings(MEDIA_ROOT=self.media.name)
        ctx.enable()
        self.addCleanup(ctx.disable)
        self.user = User.objects.create_user("a@example.com", PW)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def upload(self, kind, file):
        return self.client.post(f"/api/v1/auth/me/{kind}/", {"image": file}, format="multipart")

    def test_avatar_is_square_jpeg(self):
        r = self.upload("avatar", picture(800, 600))
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data["avatar_url"].endswith(".jpg"))
        self.user.refresh_from_db()
        with Image.open(self.user.avatar.path) as img:
            self.assertEqual(img.size, (512, 512))
            self.assertEqual(img.format, "JPEG")

    def test_cover_is_cropped_to_16_by_5(self):
        self.assertEqual(self.upload("cover", picture(2000, 1000)).status_code, 200)
        self.user.refresh_from_db()
        with Image.open(self.user.cover.path) as img:
            self.assertEqual(img.size, (1600, 500))

    def test_replace_removes_old_file(self):
        self.upload("avatar", picture())
        self.user.refresh_from_db()
        first = self.user.avatar.path
        self.upload("avatar", picture(700, 700))
        self.user.refresh_from_db()
        self.assertNotEqual(first, self.user.avatar.path)
        self.assertFalse(os.path.exists(first))
        self.assertTrue(os.path.exists(self.user.avatar.path))

    def test_delete_removes_file(self):
        self.upload("cover", picture(2000, 800))
        self.user.refresh_from_db()
        path = self.user.cover.path
        r = self.client.delete("/api/v1/auth/me/cover/")
        self.assertEqual(r.status_code, 200)
        self.assertIsNone(r.data["cover_url"])
        self.assertFalse(os.path.exists(path))
        self.user.refresh_from_db()
        self.assertFalse(self.user.cover)

    def test_not_an_image_rejected(self):
        bad = SimpleUploadedFile("evil.png", b"<script>alert(1)</script>", content_type="image/png")
        self.assertEqual(self.upload("avatar", bad).status_code, 400)
        self.user.refresh_from_db()
        self.assertFalse(self.user.avatar)

    def test_too_large_rejected(self):
        big = SimpleUploadedFile("big.png", b"x" * (2 * 1024 * 1024 + 1), content_type="image/png")
        self.assertEqual(self.upload("avatar", big).status_code, 400)

    def test_gif_rejected(self):
        self.assertEqual(self.upload("avatar", picture(300, 300, "GIF", "a.gif")).status_code, 400)

    def test_small_cover_rejected(self):
        self.assertEqual(self.upload("cover", picture(400, 100)).status_code, 400)

    def test_missing_file_rejected(self):
        r = self.client.post("/api/v1/auth/me/avatar/", {}, format="multipart")
        self.assertEqual(r.status_code, 400)

    def test_requires_auth(self):
        r = APIClient().post("/api/v1/auth/me/avatar/", {"image": picture()}, format="multipart")
        self.assertIn(r.status_code, (401, 403))

    def test_exif_metadata_is_stripped(self):
        exif = Image.Exif()
        exif[0x010F] = "SecretCamera"
        buf = io.BytesIO()
        Image.new("RGB", (600, 600), "red").save(buf, "JPEG", exif=exif)
        photo = SimpleUploadedFile("p.jpg", buf.getvalue(), content_type="image/jpeg")
        self.upload("avatar", photo)
        self.user.refresh_from_db()
        with Image.open(self.user.avatar.path) as img:
            self.assertEqual(len(img.getexif()), 0)


class ProfileDataTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user("a@example.com", PW)
        self.other = User.objects.create_user("b@example.com", PW)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def patch(self, **data):
        return self.client.patch("/api/v1/auth/me/", data, format="json")

    def test_profile_fields_are_saved(self):
        r = self.patch(username="Cool_Seller", city="Бишкек", bio="Ремонт телефонов")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["username"], "cool_seller")
        self.assertEqual(r.data["city"], "Бишкек")

    def test_invalid_usernames_rejected(self):
        for bad in ("ab", "has space", "кириллица", "admin", "x" * 31):
            with self.subTest(bad=bad):
                self.assertEqual(self.patch(username=bad).status_code, 400)

    def test_username_must_be_unique(self):
        User.objects.create_user("c@example.com", PW, username="taken_name")
        self.assertEqual(self.patch(username="Taken_Name").status_code, 400)

    def test_blank_username_clears_it(self):
        self.patch(username="my_name")
        self.assertIsNone(self.patch(username="").data["username"])

    def test_stats_count_only_own_records(self):
        RepairRequest.objects.create(customer=self.user, device="x", issue="y", phone=PHONE)
        RepairRequest.objects.create(customer=self.other, device="x", issue="y", phone=PHONE)
        r = self.client.get("/api/v1/auth/profile-stats/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["repairs"], 1)
        self.assertEqual(r.data["orders"], 0)
        self.assertNotIn("assigned_repairs", r.data)

    def test_master_stats(self):
        master = User.objects.create_user("m@example.com", PW, role="master")
        for status in ("in_progress", "delivered"):
            RepairRequest.objects.create(
                customer=self.user, master=master, device="x", issue="y", phone=PHONE, status=status
            )
        c = APIClient()
        c.force_authenticate(master)
        data = c.get("/api/v1/auth/profile-stats/").data
        self.assertEqual(data["assigned_repairs"], 1)
        self.assertEqual(data["completed_repairs"], 1)

    def test_stats_require_auth(self):
        self.assertIn(APIClient().get("/api/v1/auth/profile-stats/").status_code, (401, 403))