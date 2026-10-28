"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { apiFetch, errorMessages } from "@/lib/auth-client";

const input =
  "mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent";

export default function ResetPassword({ uid, token }: { uid?: string; token?: string }) {
  const { m } = useI18n();
  const a = m.auth;
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!uid || !token) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold">{a.linkInvalid}</h1>
        <p className="mt-2 text-muted">{a.resetInvalidHint}</p>
        <Link href="/auth/forgot" className="mt-4 inline-block text-accent hover:underline">
          {a.requestNew}
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget).entries());
    if (form.password !== form.password2) {
      setError(a.mismatch);
      return;
    }
    setPending(true);
    setError("");
    try {
      const res = await apiFetch("/auth/password-reset/confirm/", {
        method: "POST",
        body: JSON.stringify({ uid, token, password: form.password }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const errs = await errorMessages(res, m.net);
        // ошибки пароля приходят от сервера, для остальных случаев своя фраза
        setError(errs.password?.[0] ?? (res.status === 429 ? m.net.tooMany : a.resetFailed));
      }
    } catch {
      setError(m.net.offline);
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold">{a.passwordChanged}</h1>
        <Link href="/auth/login" className="mt-4 inline-block text-accent hover:underline">
          {a.loginWithNew}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold">{a.resetTitle}</h1>
      <form onSubmit={onSubmit} className="mt-8 grid gap-4" noValidate>
        <label className="text-sm text-muted">
          {a.newPassword}
          <input name="password" type="password" required autoComplete="new-password" className={input} />
        </label>
        <label className="text-sm text-muted">
          {a.repeatPassword}
          <input name="password2" type="password" required autoComplete="new-password" className={input} />
        </label>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? a.saving : a.savePassword}
        </Button>
      </form>
    </div>
  );
}