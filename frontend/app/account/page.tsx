"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { apiFetch, errorMessages } from "@/lib/auth-client";
import Link from "next/link";
import AddressBook from "@/components/AddressBook";

const input =
  "mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, refresh, logout } = useAuth();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <p className="mx-auto max-w-xl px-4 py-20 text-muted">Загрузка…</p>;
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    setPending(true);
    setErrors({});
    setNotice("");
    try {
      const res = await apiFetch("/auth/me/", { method: "PATCH", body: JSON.stringify(body) });
      if (res.ok) {
        await refresh();
        setNotice("Сохранено");
      } else {
        setErrors(await errorMessages(res));
      }
    } catch {
      setErrors({ detail: ["Нет соединения с сервером."] });
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    setNotice("");
    try {
      const res = await apiFetch("/auth/resend-verification/", { method: "POST" });
      setNotice(res.ok ? "Письмо отправлено." : "Не удалось отправить письмо.");
    } catch {
      setNotice("Нет соединения с сервером.");
    }
  }

  async function onLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Профиль</h1>

      <div className="mt-6 rounded-xl border border-line bg-surface p-4">
        <p className="text-sm text-muted">Email</p>
        <p className="font-medium">{user.email}</p>
        {user.email_verified ? (
          <p className="mt-2 text-sm text-green-400">Email подтверждён</p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-yellow-400">Email не подтверждён</span>
            <button type="button" onClick={resend} className="text-accent hover:underline">
              Отправить письмо ещё раз
            </button>
            <Link href="/orders" className="mt-4 inline-block text-accent hover:underline">Мои заказы</Link>
          </div>
        )}
      </div>

      <form onSubmit={saveProfile} className="mt-8 grid gap-4">
        <label className="text-sm text-muted">
          Имя
          <input name="first_name" defaultValue={user.first_name} className={input} />
          {errors.first_name && <span className="mt-1 block text-xs text-red-400">{errors.first_name[0]}</span>}
        </label>
        <label className="text-sm text-muted">
          Телефон
          <input name="phone" type="tel" defaultValue={user.phone} autoComplete="tel" className={input} />
          {errors.phone && <span className="mt-1 block text-xs text-red-400">{errors.phone[0]}</span>}
        </label>
        {errors.detail && <p role="alert" className="text-sm text-red-400">{errors.detail[0]}</p>}
        {notice && <p role="status" className="text-sm text-green-400">{notice}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Сохраняем…" : "Сохранить"}
        </Button>
      </form>

      {/* Книга адресов перед выходом */}
      <div className="mt-8">
        <AddressBook />
      </div>

      <Button variant="secondary" onClick={onLogout} className="mt-8">
        Выйти
      </Button>
    </div>
  );
}
