"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { apiFetch, errorMessages } from "@/lib/auth-client";
import { Emblem } from "@/components/Logo";
import GoogleSignIn from "@/components/GoogleSignIn";

const input =
  "mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { refresh } = useAuth();
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
      setErrors(await errorMessages(res));
    } catch {
      setErrors({ detail: ["Нет соединения с сервером. Попробуйте ещё раз."] });
    } finally {
      setPending(false);
    }
  }

  const fieldError = (name: string) =>
    errors[name] ? <span className="mt-1 block text-xs text-red-400">{errors[name][0]}</span> : null;

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Emblem variant="lg" className="mx-auto mb-6 h-16 w-auto" />
      <h1 className="text-3xl font-bold">{isRegister ? "Регистрация" : "Вход"}</h1>

      <form onSubmit={onSubmit} className="mt-8 grid gap-4" noValidate>
        {isRegister && (
          <label className="text-sm text-muted">
            Имя
            <input name="first_name" autoComplete="given-name" className={input} />
            {fieldError("first_name")}
          </label>
        )}
        <label className="text-sm text-muted">
          Email
          <input name="email" type="email" required autoComplete="email" className={input} />
          {fieldError("email")}
        </label>
        <label className="text-sm text-muted">
          Пароль
          <input
            name="password"
            type="password"
            required
            autoComplete={isRegister ? "new-password" : "current-password"}
            className={input}
          />
          {!isRegister && (
          <Link href="/auth/forgot" className="-mt-2 text-sm text-accent hover:underline">
            Забыли пароль?
          </Link>
        )}
          {fieldError("password")}
        </label>

        {errors.detail && (
          <p role="alert" className="text-sm text-red-400">{errors.detail[0]}</p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Подождите…" : isRegister ? "Создать аккаунт" : "Войти"}
        </Button>
      </form>

      <GoogleSignIn />
      
      <p className="mt-6 text-sm text-muted">
        {isRegister ? "Уже есть аккаунт? " : "Нет аккаунта? "}
        <Link href={isRegister ? "/auth/login" : "/auth/register"} className="text-accent hover:underline">
          {isRegister ? "Войти" : "Зарегистрироваться"}
        </Link>
      </p>
    </div>
  );
}