"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import GoogleSignIn from "@/components/GoogleSignIn";
import { useI18n } from "@/components/I18nProvider";
import { Emblem } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { apiFetch, errorMessages } from "@/lib/auth-client";

const input =
  "mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { refresh } = useAuth();
  const { m } = useI18n();
  const a = m.auth;
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const isRegister = mode === "register";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    setPending(true);
    setErrors({});
    try {
      const res = await apiFetch(`/auth/${mode}/`, { method: "POST", body: JSON.stringify(body) });
      if (res.ok) {
        await refresh();
        router.push("/account");
        return;
      }
      const errs = await errorMessages(res, m.net);
      if (res.status === 400 && errs.detail) {
        errs.detail = [isRegister ? a.registerFailed : a.invalidCredentials];
      }
      setErrors(errs);
    } catch {
      setErrors({ detail: [m.net.offline] });
    } finally {
      setPending(false);
    }
  }

  const fieldError = (name: string) =>
    errors[name] ? <span className="mt-1 block text-xs text-red-400">{errors[name][0]}</span> : null;

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Emblem variant="lg" className="mx-auto mb-6 h-16 w-auto" />
      <h1 className="text-3xl font-bold">{isRegister ? a.register : a.login}</h1>

      <form onSubmit={onSubmit} className="mt-8 grid gap-4" noValidate>
        {isRegister && (
          <label className="text-sm text-muted">
            {a.name}
            <input name="first_name" autoComplete="given-name" className={input} />
            {fieldError("first_name")}
          </label>
        )}
        <label className="text-sm text-muted">
          {a.email}
          <input name="email" type="email" required autoComplete="email" className={input} />
          {fieldError("email")}
        </label>
        <label className="text-sm text-muted">
          {a.password}
          <input
            name="password"
            type="password"
            required
            autoComplete={isRegister ? "new-password" : "current-password"}
            className={input}
          />
          {fieldError("password")}
        </label>
        {!isRegister && (
          <Link href="/auth/forgot" className="-mt-2 text-sm text-accent hover:underline">
            {a.forgot}
          </Link>
        )}

        {errors.detail && (
          <p role="alert" className="text-sm text-red-400">{errors.detail[0]}</p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? a.wait : isRegister ? a.submitRegister : a.submitLogin}
        </Button>
      </form>

      <GoogleSignIn />

      <p className="mt-6 text-sm text-muted">
        {isRegister ? a.haveAccount : a.noAccount}{" "}
        <Link href={isRegister ? "/auth/login" : "/auth/register"} className="text-accent hover:underline">
          {isRegister ? a.toLogin : a.toRegister}
        </Link>
      </p>
    </div>
  );
}