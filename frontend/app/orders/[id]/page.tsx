"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { apiFetch, errorMessages } from "@/lib/auth-client";
import { formatPrice } from "@/lib/format";
import { shortId, type Order } from "@/lib/orders";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { locale, m } = useI18n();
  const o = m.orders;
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "notfound" | "error">("loading");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/orders/${id}/`);
      if (res.status === 404) return setState("notfound");
      if (!res.ok) return setState("error");
      setOrder((await res.json()) as Order);
      setState("ok");
    } catch {
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
    if (!loading && user) void load();
  }, [loading, user, router, load]);

  async function cancel() {
    if (!window.confirm(o.cancelConfirm)) return;
    setPending(true);
    setMessage("");
    try {
      const res = await apiFetch(`/orders/${id}/cancel/`, { method: "POST" });
      if (res.ok) setOrder((await res.json()) as Order);
      else setMessage(res.status === 429 ? m.net.tooMany : o.cancelFailed);
    } catch {
      setMessage(m.net.offline);
    } finally {
      setPending(false);
    }
  }

  if (loading || state === "loading") return <p className="mx-auto max-w-3xl px-4 py-20 text-muted">{m.common.loading}</p>;
  if (state === "notfound") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="text-2xl font-bold">{o.notFound}</h1>
        <Link href="/orders" className="mt-4 inline-block text-accent hover:underline">{o.toOrders}</Link>
      </div>
    );
  }
  if (state === "error" || !order) {
    return <p className="mx-auto max-w-3xl px-4 py-20 text-red-400">{o.detailFailed}</p>;
  }

  const row = "flex justify-between gap-4 px-4 py-3";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/orders" className="text-sm text-muted hover:text-fg">{o.back}</Link>
      <h1 className="mt-3 text-3xl font-bold">{m.profile.order(shortId(order.id))}</h1>
      <p className="mt-1 text-accent">{o.status[order.status] ?? order.status_display}</p>

      <ul className="mt-6 divide-y divide-line rounded-xl border border-line">
        {order.items.map((it, i) => (
          <li key={i} className="flex justify-between gap-4 px-4 py-3 text-sm">
            <span>
              {it.product_name}
              {it.variant_title && <span className="text-muted"> · {it.variant_title}</span>}
              <span className="text-muted"> × {it.quantity}</span>
            </span>
            <span className="font-medium">{formatPrice(it.line_total, locale)}</span>
          </li>
        ))}
        <li className={row}>
          <span className="text-muted">{o.total}</span>
          <span className="text-lg font-bold">{formatPrice(order.total, locale)}</span>
        </li>
      </ul>

      <dl className="mt-6 divide-y divide-line rounded-xl border border-line text-sm">
        <div className={row}><dt className="text-muted">{o.recipient}</dt><dd>{order.full_name}</dd></div>
        <div className={row}><dt className="text-muted">{o.phone}</dt><dd>{order.phone}</dd></div>
        <div className={row}>
          <dt className="text-muted">{o.receiving}</dt>
          <dd>{order.delivery_method === "pickup" ? m.checkout.pickup : m.checkout.delivery}</dd>
        </div>
        {order.delivery_method === "delivery" ? (
          <div className={row}><dt className="text-muted">{o.address}</dt><dd className="text-right">{order.address}</dd></div>
        ) : (
          <div className={row}>
            <dt className="text-muted">{o.pickupPoint}</dt>
            <dd className="text-right">{order.pickup_point || o.pickupTbd}</dd>
          </div>
        )}
        <div className={row}><dt className="text-muted">{o.payment}</dt><dd>{o.cod}</dd></div>
      </dl>

      {order.can_cancel && (
        <Button variant="secondary" className="mt-6" disabled={pending} onClick={cancel}>{o.cancel}</Button>
      )}
      {message && <p role="alert" className="mt-4 text-sm text-red-400">{message}</p>}
    </div>
  );
}