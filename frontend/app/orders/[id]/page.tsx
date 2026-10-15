"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { apiFetch, errorMessages } from "@/lib/auth-client";
import { formatPrice } from "@/lib/format";
import { shortId, type Order } from "@/lib/orders";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
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
    if (!window.confirm("Отменить заказ?")) return;
    setPending(true);
    setMessage("");
    try {
      const res = await apiFetch(`/orders/${id}/cancel/`, { method: "POST" });
      if (res.ok) setOrder((await res.json()) as Order);
      else setMessage(Object.values(await errorMessages(res))[0]?.[0] ?? "Не удалось отменить заказ.");
    } catch {
      setMessage("Нет соединения с сервером.");
    } finally {
      setPending(false);
    }
  }

  if (loading || state === "loading") return <p className="mx-auto max-w-3xl px-4 py-20 text-muted">Загрузка…</p>;
  if (state === "notfound") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="text-2xl font-bold">Заказ не найден</h1>
        <Link href="/orders" className="mt-4 inline-block text-accent hover:underline">К моим заказам</Link>
      </div>
    );
  }
  if (state === "error" || !order) {
    return <p className="mx-auto max-w-3xl px-4 py-20 text-red-400">Не удалось загрузить заказ.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/orders" className="text-sm text-muted hover:text-fg">← Заказы</Link>
      <h1 className="mt-3 text-3xl font-bold">Заказ {shortId(order.id)}</h1>
      <p className="mt-1 text-accent">{order.status_display}</p>

      <ul className="mt-6 divide-y divide-line rounded-xl border border-line">
        {order.items.map((it, i) => (
          <li key={i} className="flex justify-between gap-4 px-4 py-3 text-sm">
            <span>
              {it.product_name}
              {it.variant_title && <span className="text-muted"> · {it.variant_title}</span>}
              <span className="text-muted"> × {it.quantity}</span>
            </span>
            <span className="font-medium">{formatPrice(it.line_total)}</span>
          </li>
        ))}
        <li className="flex justify-between gap-4 px-4 py-3">
          <span className="text-muted">Итого</span>
          <span className="text-lg font-bold">{formatPrice(order.total)}</span>
        </li>
      </ul>

      <dl className="mt-6 divide-y divide-line rounded-xl border border-line text-sm">
        <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-muted">Получатель</dt><dd>{order.full_name}</dd></div>
        <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-muted">Телефон</dt><dd>{order.phone}</dd></div>
        
        {/* Обновленный блок получения и адреса */}
        <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-muted">Получение</dt><dd>{order.delivery_display}</dd></div>
        {order.delivery_method === "delivery" ? (
          <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-muted">Адрес</dt><dd className="text-right">{order.address}</dd></div>
        ) : (
          <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-muted">Пункт самовывоза</dt><dd className="text-right">{order.pickup_point || "Адрес сообщим при подтверждении заказа"}</dd></div>
        )}
        
        <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-muted">Оплата</dt><dd>{order.payment_method}</dd></div>
      </dl>

      {order.can_cancel && (
        <Button variant="secondary" className="mt-6" disabled={pending} onClick={cancel}>Отменить заказ</Button>
      )}
      {message && <p role="alert" className="mt-4 text-sm text-red-400">{message}</p>}
    </div>
  );
}
