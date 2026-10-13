"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { apiFetch, errorMessages } from "@/lib/auth-client";
import { formatDate, STATUS_LABEL, type Repair } from "@/lib/repairs";

const input =
  "mt-1 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent";

export default function RepairPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await apiFetch("/repairs/");
        if (res.ok) setRepairs((await res.json()) as Repair[]);
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
      const res = await apiFetch("/repairs/", { method: "POST", body: JSON.stringify(body) });
      if (res.ok) {
        const created = (await res.json()) as Repair;
        router.push(`/repair/${created.id}`);
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
        <h1 className="text-3xl font-bold">Ремонт</h1>
        <p className="mt-3 text-muted">
          Чтобы оставить заявку и следить за её статусом, войдите в аккаунт.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/auth/login">Войти</ButtonLink>
          <ButtonLink href="/auth/register" variant="secondary">Создать аккаунт</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Заявка на ремонт</h1>

      <form onSubmit={onSubmit} className="mt-8 grid gap-4" noValidate>
        <label className="text-sm text-muted">
          Устройство
          <input name="device" required maxLength={120} placeholder="Например: iPhone 13" className={`${input} h-11`} />
          {fieldError("device")}
        </label>
        <label className="text-sm text-muted">
          Что случилось
          <textarea name="issue" required maxLength={2000} rows={4} className={`${input} py-2`} />
          {fieldError("issue")}
        </label>
        <label className="text-sm text-muted">
          Телефон для связи
          <input name="phone" type="tel" required autoComplete="tel" placeholder="+996 ..." className={`${input} h-11`} />
          {fieldError("phone")}
        </label>
        {errors.detail && <p role="alert" className="text-sm text-red-400">{errors.detail[0]}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Отправляем…" : "Отправить заявку"}
        </Button>
      </form>

      <h2 className="mt-12 text-xl font-semibold">Мои заявки</h2>
      {repairs.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Заявок пока нет.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
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