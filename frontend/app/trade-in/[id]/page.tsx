"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { apiFetch, errorMessages } from "@/lib/auth-client";
import { formatPrice } from "@/lib/format";
import { RESPONSE_LABEL, TRADE_STATUS, type TradeIn } from "@/lib/tradein";

export default function TradeInDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [item, setItem] = useState<TradeIn | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "notfound" | "error">("loading");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/trade-ins/${id}/`);
      if (res.status === 404) return setState("notfound");
      if (!res.ok) return setState("error");
      setItem((await res.json()) as TradeIn);
      setState("ok");
    } catch {
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
    if (!loading && user) void load();
  }, [loading, user, router, load]);

  async function respond(status: string) {
    setPending(true);
    setMessage("");
    try {
      const res = await apiFetch(`/trade-ins/${id}/respond/`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      if (res.ok) setItem((await res.json()) as TradeIn);
      else setMessage(Object.values(await errorMessages(res))[0]?.[0] ?? "Не удалось выполнить действие.");
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
        <h1 className="text-2xl font-bold">Заявка не найдена</h1>
        <Link href="/trade-in" className="mt-4 inline-block text-accent hover:underline">К моим заявкам</Link>
      </div>
    );
  }
  if (state === "error" || !item) {
    return <p className="mx-auto max-w-3xl px-4 py-20 text-red-400">Не удалось загрузить заявку.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/trade-in" className="text-sm text-muted hover:text-fg">← Заявки</Link>
      <h1 className="mt-3 text-3xl font-bold">{item.device}</h1>
      <p className="mt-1 text-accent">{TRADE_STATUS[item.status] ?? item.status_display}</p>

      <dl className="mt-6 divide-y divide-line rounded-xl border border-line text-sm">
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-muted">Состояние</dt>
          <dd>{item.condition_display}</dd>
        </div>
        {item.description && (
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted">Описание</dt>
            <dd className="max-w-[70%] text-right">{item.description}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-muted">Телефон</dt>
          <dd>{item.phone}</dd>
        </div>
        {item.offer_amount && (
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted">Предложение</dt>
            <dd className="text-right">
              <span className="font-semibold">{formatPrice(item.offer_amount)}</span>
              {item.offer_note && <span className="block text-muted">{item.offer_note}</span>}
            </dd>
          </div>
        )}
      </dl>

      {item.allowed_actions.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {item.allowed_actions.map((a) => (
            <Button
              key={a}
              variant={a === "accepted" ? "primary" : "secondary"}
              disabled={pending}
              onClick={() => respond(a)}
            >
              {RESPONSE_LABEL[a] ?? a}
            </Button>
          ))}
        </div>
      )}
      {message && <p role="alert" className="mt-4 text-sm text-red-400">{message}</p>}
    </div>
  );
}