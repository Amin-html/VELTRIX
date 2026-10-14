"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiFetch, errorMessages } from "@/lib/auth-client";

const input =
  "mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent";

export default function ForgotPassword() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    setPending(true);
    setError("");
    try {
      const res = await apiFetch("/auth/password-reset/", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res.ok) setDone(true);
      else setError(Object.values(await errorMessages(res))[0]?.[0] ?? "Не удалось отправить запрос.");
    } catch {
      setError("Нет соединения с сервером. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold">Восстановление пароля</h1>

      {done ? (
        <p role="status" className="mt-6 text-muted">
          Если аккаунт с таким email существует, мы отправили письмо со ссылкой для сброса пароля.
          Ссылка действует 1 час.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 grid gap-4" noValidate>
          <label className="text-sm text-muted">
            Email
            <input name="email" type="email" required autoComplete="email" className={input} />
          </label>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Отправляем…" : "Отправить ссылку"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-muted">
        <Link href="/auth/login" className="text-accent hover:underline">Вернуться ко входу</Link>
      </p>
    </div>
  );
}