"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/auth-client";
import { formatDate, STATUS_LABEL, type Repair } from "@/lib/repairs";

export default function MasterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "forbidden" | "error">("loading");

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
    if (loading || !user) return;
    (async () => {
      try {
        const res = await apiFetch("/repairs/master/");
        if (res.status === 403) return setState("forbidden");
        if (!res.ok) return setState("error");
        setRepairs((await res.json()) as Repair[]);
        setState("ok");
      } catch {
        setState("error");
      }
    })();
  }, [loading, user, router]);

  if (state === "loading") return <p className="mx-auto max-w-3xl px-4 py-20 text-muted">Загрузка…</p>;
  if (state === "forbidden") {
    return <p className="mx-auto max-w-3xl px-4 py-20">Этот раздел доступен только мастерам.</p>;
  }
  if (state === "error") {
    return <p className="mx-auto max-w-3xl px-4 py-20 text-red-400">Не удалось загрузить заявки.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Кабинет мастера</h1>
      {repairs.length === 0 ? (
        <p className="mt-6 text-muted">Назначенных заявок пока нет.</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {repairs.map((r) => (
            <li key={r.id}>
              <Link
                href={`/repair/${r.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 hover:bg-raised"
              >
                <span>
                  <span className="block font-medium">{r.device}</span>
                  <span className="text-xs text-muted">{formatDate(r.created_at)}</span>
                </span>
                <span className="text-sm text-accent">{STATUS_LABEL[r.status] ?? r.status_display}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}