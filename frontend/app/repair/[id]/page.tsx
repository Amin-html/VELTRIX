"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { apiFetch, errorMessages } from "@/lib/auth-client";
import { formatPrice } from "@/lib/format";
import { ACTION_LABEL, formatDate, STATUS_LABEL, type Repair } from "@/lib/repairs";

const input =
  "mt-1 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent";

export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [repair, setRepair] = useState<Repair | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "notfound" | "error">("loading");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/repairs/${id}/`);
      if (res.status === 404) return setState("notfound");
      if (!res.ok) return setState("error");
      setRepair((await res.json()) as Repair);
      setState("ok");
    } catch {
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
    if (!loading && user) void load();
  }, [loading, user, router, load]);

  async function act(path: string, body: unknown) {
    setPending(true);
    setMessage("");
    try {
      const res = await apiFetch(`/repairs/${id}/${path}/`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setRepair((await res.json()) as Repair);
      } else {
        const errs = await errorMessages(res);
        setMessage(Object.values(errs)[0]?.[0] ?? "Не удалось выполнить действие.");
      }
    } catch {
      setMessage("Нет соединения с сервером.");
    } finally {
      setPending(false);
    }
  }

  function sendQuote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    void act("quote", body);
  }

  if (loading || state === "loading") {
    return <p className="mx-auto max-w-3xl px-4 py-20 text-muted">Загрузка…</p>;
  }
  if (state === "notfound") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="text-2xl font-bold">Заявка не найдена</h1>
        <Link href="/repair" className="mt-4 inline-block text-accent hover:underline">К моим заявкам</Link>
      </div>
    );
  }
  if (state === "error" || !repair) {
    return <p className="mx-auto max-w-3xl px-4 py-20 text-red-400">Не удалось загрузить заявку.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/repair" className="text-sm text-muted hover:text-fg">← Заявки</Link>
      <h1 className="mt-3 text-3xl font-bold">{repair.device}</h1>
      <p className="mt-1 text-accent">{STATUS_LABEL[repair.status] ?? repair.status_display}</p>

      <dl className="mt-6 divide-y divide-line rounded-xl border border-line text-sm">
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-muted">Неисправность</dt>
          <dd className="max-w-[70%] text-right">{repair.issue}</dd>
        </div>
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-muted">Телефон</dt>
          <dd>{repair.phone}</dd>
        </div>
        {repair.quote_amount && (
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted">Смета</dt>
            <dd className="text-right">
              <span className="font-semibold">{formatPrice(repair.quote_amount)}</span>
              {repair.quote_note && <span className="block text-muted">{repair.quote_note}</span>}
            </dd>
          </div>
        )}
      </dl>

      {repair.allowed_statuses.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {repair.allowed_statuses.map((s) => (
            <Button
              key={s}
              variant={s === "cancelled" ? "secondary" : "primary"}
              disabled={pending}
              onClick={() => act("status", { status: s })}
            >
              {ACTION_LABEL[s] ?? s}
            </Button>
          ))}
        </div>
      )}

      {repair.can_quote && (
        <form onSubmit={sendQuote} className="mt-6 grid gap-3 rounded-xl border border-line bg-surface p-4">
          <h2 className="font-semibold">Отправить смету клиенту</h2>
          <label className="text-sm text-muted">
            Сумма, сом
            <input name="amount" type="number" min="0.01" step="0.01" required className={`${input} h-11`} />
          </label>
          <label className="text-sm text-muted">
            Комментарий
            <input name="note" maxLength={500} className={`${input} h-11`} />
          </label>
          <Button type="submit" disabled={pending}>Отправить смету</Button>
        </form>
      )}

      {message && <p role="alert" className="mt-4 text-sm text-red-400">{message}</p>}

      <h2 className="mt-10 text-lg font-semibold">История</h2>
      <ol className="mt-3 grid gap-3 border-l border-line pl-4">
        {repair.events.map((ev, i) => (
          <li key={i} className="text-sm">
            <span className="font-medium">{STATUS_LABEL[ev.to_status] ?? ev.to_status}</span>
            <span className="ml-2 text-xs text-muted">{formatDate(ev.created_at)}</span>
            {ev.note && <span className="block text-muted">{ev.note}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}