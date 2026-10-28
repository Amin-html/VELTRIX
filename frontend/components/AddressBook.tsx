"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { useAddresses } from "@/components/useAddresses";
import { apiFetch, errorMessages } from "@/lib/auth-client";

const input =
  "mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent";

export default function AddressBook() {
  const { m } = useI18n();
  const t = m.addresses;
  const { items, state, reload } = useAddresses(true);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    setPending(true);
    setErrors({});
    try {
      const res = await apiFetch("/auth/addresses/", { method: "POST", body: JSON.stringify(body) });
      if (res.ok) {
        form.reset();
        await reload();
      } else {
        setErrors(await errorMessages(res, m.net));
      }
    } catch {
      setErrors({ detail: [m.net.offline] });
    } finally {
      setPending(false);
    }
  }

  async function onDelete(id: number) {
    setErrors({});
    try {
      const res = await apiFetch(`/auth/addresses/${id}/`, { method: "DELETE" });
      if (res.ok) await reload();
      else setErrors(await errorMessages(res, m.net));
    } catch {
      setErrors({ detail: [m.net.offline] });
    }
  }

  return (
    <section className="mt-10" aria-labelledby="addresses-title">
      <h2 id="addresses-title" className="text-xl font-semibold">{t.title}</h2>

      {state === "loading" && <p className="mt-3 text-sm text-muted">{m.common.loading}</p>}
      {state === "error" && <p className="mt-3 text-sm text-red-400">{t.loadFailed}</p>}
      {state === "ok" && items.length === 0 && <p className="mt-3 text-sm text-muted">{t.none}</p>}
      {items.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {items.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-3 text-sm">
              <span>
                <span className="block font-medium">{a.label}</span>
                <span className="text-muted">{a.address}</span>
              </span>
              <button type="button" onClick={() => onDelete(a.id)} className="text-muted hover:text-fg">
                {t.remove}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onAdd} className="mt-4 grid gap-3" noValidate>
        <label className="text-sm text-muted">
          {t.label}
          <input name="label" required maxLength={60} placeholder={t.labelPlaceholder} className={input} />
          {errors.label && <span className="mt-1 block text-xs text-red-400">{errors.label[0]}</span>}
        </label>
        <label className="text-sm text-muted">
          {t.address}
          <input name="address" required maxLength={300} className={input} />
          {errors.address && <span className="mt-1 block text-xs text-red-400">{errors.address[0]}</span>}
        </label>
        {errors.detail && <p role="alert" className="text-sm text-red-400">{errors.detail[0]}</p>}
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? t.adding : t.add}
        </Button>
      </form>
    </section>
  );
}