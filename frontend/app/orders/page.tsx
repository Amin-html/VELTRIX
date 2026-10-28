"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import { apiFetch } from "@/lib/auth-client";
import { formatPrice } from "@/lib/format";
import { shortId, type Order } from "@/lib/orders";

export default function OrdersPage() {
  const router = useRouter();
  const { locale, m } = useI18n();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
    if (loading || !user) return;
    (async () => {
      try {
        const res = await apiFetch("/orders/");
        if (!res.ok) return setState("error");
        setOrders((await res.json()) as Order[]);
        setState("ok");
      } catch {
        setState("error");
      }
    })();
  }, [loading, user, router]);

  if (state === "loading") return <p className="mx-auto max-w-3xl px-4 py-20 text-muted">{m.common.loading}</p>;
  if (state === "error") return <p className="mx-auto max-w-3xl px-4 py-20 text-red-400">{m.orders.loadFailed}</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">{m.orders.title}</h1>
      {orders.length === 0 ? (
        <p className="mt-6 text-muted">{m.orders.none}</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 hover:bg-raised">
                <span>
                  <span className="block font-medium">{m.profile.order(shortId(o.id))}</span>
                  <span className="text-xs text-muted">
                    {new Date(o.created_at).toLocaleString(locale === "en" ? "en-US" : "ru-RU")}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-semibold">{formatPrice(o.total, locale)}</span>
                  <span className="text-sm text-accent">{m.orders.status[o.status] ?? o.status_display}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}