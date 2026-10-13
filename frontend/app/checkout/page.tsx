"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { useCartDetails } from "@/components/useCartDetails";
import { apiFetch, errorMessages } from "@/lib/auth-client";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/orders";

const input =
  "mt-1 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { lines, ready, clear } = useCart();
  const { variants, state } = useCartDetails(lines, ready);
  const [idemKey] = useState(() => crypto.randomUUID());
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  if (loading || !user || !ready || state === "loading") {
    return <p className="mx-auto max-w-xl px-4 py-20 text-muted">Загрузка…</p>;
  }
  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <h1 className="text-2xl font-bold">Корзина пуста</h1>
        <Link href="/catalog" className="mt-4 inline-block text-accent hover:underline">В каталог</Link>
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
        body: JSON.stringify({ ...fields, items: lines, idempotency_key: idemKey }),
      });
      if (res.ok) {
        const order = (await res.json()) as Order;
        clear();
        router.push(`/orders/${order.id}`);
        return;
      }
      setErrors(await errorMessages(res));
    } catch {
      setErrors({ detail: ["Нет соединения с сервером. Повторите попытку: заказ не будет создан дважды."] });
    } finally {
      setPending(false);
    }
  }

  const fieldError = (name: string) =>
    errors[name] ? <span className="mt-1 block text-xs text-red-400">{errors[name][0]}</span> : null;
  const unverified = !user.email_verified;

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Оформление заказа</h1>

      {unverified && (
        <p role="alert" className="mt-4 text-sm text-yellow-400">
          Чтобы оформить заказ, подтвердите email в{" "}
          <Link href="/account" className="underline">профиле</Link>.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
        <label className="text-sm text-muted">
          Имя и фамилия
          <input name="full_name" required maxLength={120} defaultValue={user.first_name} autoComplete="name" className={`${input} h-11`} />
          {fieldError("full_name")}
        </label>
        <label className="text-sm text-muted">
          Телефон
          <input name="phone" type="tel" required defaultValue={user.phone} autoComplete="tel" className={`${input} h-11`} />
          {fieldError("phone")}
        </label>
        <label className="text-sm text-muted">
          Адрес доставки
          <input name="address" required maxLength={300} autoComplete="street-address" className={`${input} h-11`} />
          {fieldError("address")}
        </label>
        <label className="text-sm text-muted">
          Комментарий (необязательно)
          <textarea name="comment" maxLength={500} rows={3} className={`${input} py-2`} />
        </label>

        <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-4">
          <span className="text-muted">Итого, оплата при получении</span>
          <span className="text-lg font-bold">{formatPrice(total)}</span>
        </div>

        {errors.items && <p role="alert" className="text-sm text-red-400">{errors.items[0]}</p>}
        {errors.detail && <p role="alert" className="text-sm text-red-400">{errors.detail[0]}</p>}
        {problem && (
          <p role="alert" className="text-sm text-red-400">
            Часть товаров недоступна. <Link href="/cart" className="underline">Вернитесь в корзину</Link>.
          </p>
        )}

        <Button type="submit" disabled={pending || problem || unverified}>
          {pending ? "Оформляем…" : "Подтвердить заказ"}
        </Button>
      </form>
    </div>
  );
}