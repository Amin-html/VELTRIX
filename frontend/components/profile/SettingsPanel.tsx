"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AddressBook from "@/components/AddressBook";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import ImageUploader from "@/components/profile/ImageUploader";
import { Button } from "@/components/ui/Button";
import { apiFetch, errorMessages, type User } from "@/lib/auth-client";

const input =
  "mt-1 w-full rounded-lg border border-line bg-bg px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent";
const card = "rounded-2xl border border-line bg-surface p-5";

export default function SettingsPanel({ user }: { user: User }) {
  const router = useRouter();
  const { refresh, logout } = useAuth();
  const { m } = useI18n();
  const p = m.profile;
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget).entries());
    const body = {
      first_name: f.first_name,
      username: f.username,
      city: f.city,
      bio: f.bio,
      phone: f.phone,
    };
    setPending(true);
    setErrors({});
    setNotice("");
    try {
      const res = await apiFetch("/auth/me/", { method: "PATCH", body: JSON.stringify(body) });
      if (res.ok) {
        await refresh();
        setNotice(p.form.saved);
      } else {
        setErrors(await errorMessages(res));
      }
    } catch {
      setErrors({ detail: [p.form.offline] });
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    setResendMsg("");
    try {
      const res = await apiFetch("/auth/resend-verification/", { method: "POST" });
      setResendMsg(res.ok ? p.resent : p.resendFailed);
    } catch {
      setResendMsg(p.form.offline);
    }
  }

  async function onLogout() {
    await logout();
    router.push("/");
  }

  const err = (name: string) =>
    errors[name] ? <span className="mt-1 block text-xs text-red-400">{errors[name][0]}</span> : null;

  return (
    <div className="grid gap-6">
      <form onSubmit={onSave} className="grid gap-6" noValidate>
        <section className={card} aria-labelledby="set-basic">
          <h2 id="set-basic" className="text-lg font-semibold">{p.sections.basic}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-muted">
              {p.form.name}
              <input name="first_name" defaultValue={user.first_name} maxLength={80} autoComplete="given-name" className={`${input} h-11`} />
              {err("first_name")}
            </label>
            <label className="text-sm text-muted">
              {p.form.username}
              <input name="username" defaultValue={user.username ?? ""} maxLength={30} autoCapitalize="none" spellCheck={false} className={`${input} h-11`} />
              <span className="mt-1 block text-xs">{p.form.usernameHint}</span>
              {err("username")}
            </label>
            <label className="text-sm text-muted">
              {p.form.city}
              <input name="city" defaultValue={user.city} maxLength={60} autoComplete="address-level2" className={`${input} h-11`} />
              {err("city")}
            </label>
            <label className="text-sm text-muted sm:col-span-2">
              {p.form.bio}
              <textarea name="bio" defaultValue={user.bio} maxLength={200} rows={3} className={`${input} py-2`} />
              {err("bio")}
            </label>
          </div>
        </section>

        <section className={card} aria-labelledby="set-contacts">
          <h2 id="set-contacts" className="text-lg font-semibold">{p.sections.contacts}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="text-sm text-muted">
              {p.form.email}
              <p className="mt-1 break-all text-fg">{user.email}</p>
              <p className="mt-1 text-xs">{p.form.emailLocked}</p>
              {!user.email_verified && (
                <div className="mt-2 text-xs">
                  <button type="button" onClick={resend} className="text-accent hover:underline">
                    {p.resend}
                  </button>
                  {resendMsg && <span className="ml-2">{resendMsg}</span>}
                </div>
              )}
            </div>
            <label className="text-sm text-muted">
              {p.form.phone}
              <input name="phone" type="tel" defaultValue={user.phone} autoComplete="tel" className={`${input} h-11`} />
              {err("phone")}
            </label>
          </div>
        </section>

        {errors.detail && <p role="alert" className="text-sm text-red-400">{errors.detail[0]}</p>}
        {notice && <p role="status" className="text-sm text-green-400">{notice}</p>}
        <Button type="submit" disabled={pending} className="sm:w-fit">
          {pending ? p.form.saving : p.form.save}
        </Button>
      </form>

      <section id="profile-media" className={card} aria-labelledby="set-media">
        <h2 id="set-media" className="text-lg font-semibold">{p.sections.media}</h2>
        <div className="mt-4 grid gap-6">
          <ImageUploader kind="avatar" currentUrl={user.avatar_url} maxMb={2} />
          <ImageUploader kind="cover" currentUrl={user.cover_url} maxMb={5} />
        </div>
      </section>

      <AddressBook />

      <section className={card} aria-labelledby="set-privacy">
        <h2 id="set-privacy" className="text-lg font-semibold">{p.sections.privacy}</h2>
        <p className="mt-2 text-sm text-muted">{p.privacyText}</p>
        <Button variant="secondary" onClick={onLogout} className="mt-4">{p.logout}</Button>
      </section>
    </div>
  );
}