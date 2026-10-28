"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { useAddresses } from "@/components/useAddresses";
import { useCartDetails } from "@/components/useCartDetails";
import { apiFetch, errorMessages } from "@/lib/auth-client";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/orders";

const input =
  "mt-1 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent";

export default function CheckoutPage() {
  const router = useRouter();
  const { locale, m } = useI18n();
  const c = m.checkout;
  const { user, loading } = useAuth();
  const { lines, ready, clear } = useCart();
  const { variants, state } = useCartDetails(lines, ready);
  const { items: saved } = useAddresses(!!user);
  const [idemKey] = useState(() => crypto.randomUUID());
  const [method, setMethod] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  if (loading || !user || !ready || state === "loading") {
    return <p className="mx-auto max-w-xl px-4 py-20 text-muted">{m.common.loading}</p>;
  }
  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <h1 className="text-2xl font-bold">{m.cart.empty}</h1>
        <Link href="/catalog" className="mt-4 inline-block text-accent hover:underline">
          {m.cart.toCatalog}
        </Link>
      </div>
    );
  }

  let total = 0;
  let problem = false;
  for (const line of lines) {
    const v = variants[line.variant];
    if (v && v.stock >= line.quantity) total += Number(v.price) * line.quantity;
    else problem = true;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fields = Object.fromEntries(new FormData(e.currentTarget).entries());
    setPending(true);
    setErrors({});
    try {
      const res = await apiFetch("/orders/", {
        method: "POST",
        body: JSON.stringify({
          ...fields,
          delivery_method: method,
          address: method === "delivery" ? address : "",
          items: lines,
          idempotency_key: idemKey,
        }),
      });
      if (res.ok) {
        const order = (await res.json()) as Order;
        clear();
        router.push(`/orders/${order.id}`);
        return;
      }
      setErrors(await errorMessages(res, m.net));
    } catch {
      setErrors({ detail: [c.retryHint] });
    } finally {
      setPending(false);
    }
  }

  const fieldError = (name: string) =>
    errors[name] ? <span className="mt-1 block text-xs text-red-400">{errors[name][0]}</span> : null;
  const unverified = !user.email_verified;

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">{c.title}</h1>

      {unverified && (
        <p role="alert" className="mt-4 text-sm text-yellow-400">
          {c.verifyBefore}
          <Link href="/account#settings" className="underline">{c.verifyLink}</Link>
          {c.verifyAfter}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
        <label className="text-sm text-muted">
          {c.fullName}
          <input name="full_name" required maxLength={120} defaultValue={user.first_name} autoComplete="name" className={`${input} h-11`} />
          {fieldError("full_name")}
        </label>
        <label className="text-sm text-muted">
          {c.phone}
          <input name="phone" type="tel" required defaultValue={user.phone} autoComplete="tel" className={`${input} h-11`} />
          {fieldError("phone")}
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-sm text-muted">{c.method}</legend>
          {(["delivery", "pickup"] as const).map((value) => (
            <label key={value} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-3 text-sm">
              <input
                type="radio"
                name="delivery_method"
                value={value}
                checked={method === value}
                onChange={() => setMethod(value)}
              />
              {value === "delivery" ? c.delivery : c.pickup}
            </label>
          ))}
        </fieldset>

        {method === "delivery" ? (
          <>
            {saved.length > 0 && (
              <label className="text-sm text-muted">
                {c.savedAddresses}
                <select
                  defaultValue=""
                  onChange={(e) => e.target.value && setAddress(e.target.value)}
                  className={`${input} h-11`}
                >
                  <option value="">{c.choose}</option>
                  {saved.map((a) => (
                    <option key={a.id} value={a.address}>{a.label}: {a.address}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="text-sm text-muted">
              {c.address}
              <input
                name="address"
                required
                maxLength={300}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="street-address"
                className={`${input} h-11`}
              />
              {fieldError("address")}
            </label>
            <p className="text-xs text-muted">{c.deliveryNote}</p>
          </>
        ) : (
          <p className="text-sm text-muted">{c.pickupNote}</p>
        )}

        <label className="text-sm text-muted">
          {c.comment}
          <textarea name="comment" maxLength={500} rows={3} className={`${input} py-2`} />
        </label>

        <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-4">
          <span className="text-muted">{c.totalCod}</span>
          <span className="text-lg font-bold">{formatPrice(total, locale)}</span>
        </div>

        {errors.items && <p role="alert" className="text-sm text-red-400">{errors.items[0]}</p>}
        {errors.detail && <p role="alert" className="text-sm text-red-400">{errors.detail[0]}</p>}
        {problem && (
          <p role="alert" className="text-sm text-red-400">
            {c.unavailableBefore}
            <Link href="/cart" className="underline">{c.backToCart}</Link>.
          </p>
        )}

        <Button type="submit" disabled={pending || problem || unverified}>
          {pending ? c.submitting : c.submit}
        </Button>
      </form>
    </div>
  );
}