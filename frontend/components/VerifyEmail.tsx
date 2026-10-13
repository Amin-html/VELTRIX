"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/auth-client";

export default function VerifyEmail({ token }: { token?: string }) {
  const { refresh } = useAuth();
  const [state, setState] = useState<"loading" | "ok" | "error">(token ? "loading" : "error");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/auth/verify-email/", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        if (cancelled) return;
        setState(res.ok ? "ok" : "error");
        if (res.ok) await refresh();
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, refresh]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
      {state === "loading" && <p className="text-muted">Подтверждаем email…</p>}
      {state === "ok" && (
        <>
          <h1 className="text-2xl font-bold">Email подтверждён</h1>
          <Link href="/account" className="mt-6 inline-block text-accent hover:underline">
            Перейти в профиль
          </Link>
        </>
      )}
      {state === "error" && (
        <>
          <h1 className="text-2xl font-bold">Ссылка недействительна</h1>
          <p className="mt-2 text-muted">Она могла устареть. Запросите новое письмо в профиле.</p>
          <Link href="/account" className="mt-6 inline-block text-accent hover:underline">
            Перейти в профиль
          </Link>
        </>
      )}
    </div>
  );
}