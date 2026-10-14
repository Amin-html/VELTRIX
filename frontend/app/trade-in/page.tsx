"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { apiFetch, errorMessages } from "@/lib/auth-client";
import { formatDate } from "@/lib/repairs";
import { CONDITION_OPTIONS, TRADE_STATUS, type TradeIn } from "@/lib/tradein";

const input =
  "mt-1 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent";

export default function TradeInPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<TradeIn[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await apiFetch("/trade-ins/");
        if (res.ok) setItems((await res.json()) as TradeIn[]);
      } catch {
        /* список не критичен для формы */
      }
    })();
  }, [user]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    setPending(true);
    setErrors({});
    try {
      const res = await apiFetch("/trade-ins/", { method: "POST", body: JSON.stringify(body) });
      if (res.ok) {
        const created = (await res.json()) as TradeIn;
        router.push(`/trade-in/${created.id}`);
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

  if (loading) return <p className="mx-auto max-w-3xl px-4 py-20 text-muted">Загрузка…</p>;

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
        <h1 className="text-3xl font-bold">Выкуп техники</h1>
        <p className="mt-3 text-muted">Чтобы оставить заявку и получить предложение, войдите в аккаунт.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/auth/login">Войти</ButtonLink>
          <ButtonLink href="/auth/register" variant="secondary">Создать аккаунт</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Выкуп техники</h1>
      <p className="mt-2 text-sm text-muted">
        Опишите устройство. Мы пришлём предложение по цене после проверки, и вы сами решите, принимать его или нет.
      </p>

      <form onSubmit={onSubmit} className="mt-8 grid gap-4" noValidate>
        <label className="text-sm text-muted">
          Устройство
          <input name="device" required maxLength={120} placeholder="Например: iPhone 12, 128 GB" className={`${input} h-11`} />
          {fieldError("device")}
        </label>
        <label className="text-sm text-muted">
          Состояние
          <select name="condition" defaultValue="good" className={`${input} h-11`}>
            {CONDITION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {fieldError("condition")}
        </label>
        <label className="text-sm text-muted">
          Описание (необязательно)
          <textarea name="description" maxLength={1000} rows={4} placeholder="Комплект, царапины, неисправности" className={`${input} py-2`} />
          {fieldError("description")}
        </label>
        <label className="text-sm text-muted">
          Телефон для связи
          <input name="phone" type="tel" required defaultValue={user.phone} autoComplete="tel" className={`${input} h-11`} />
          {fieldError("phone")}
        </label>
        {errors.detail && <p role="alert" className="text-sm text-red-400">{errors.detail[0]}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Отправляем…" : "Отправить заявку"}
        </Button>
      </form>

      <h2 className="mt-12 text-xl font-semibold">Мои заявки</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Заявок пока нет.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {items.map((t) => (
            <li key={t.id}>
              <Link
                href={`/trade-in/${t.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 hover:bg-raised"
              >
                <span>
                  <span className="block font-medium">{t.device}</span>
                  <span className="text-xs text-muted">{formatDate(t.created_at)}</span>
                </span>
                <span className="text-sm text-accent">{TRADE_STATUS[t.status] ?? t.status_display}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}