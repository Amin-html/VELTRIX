"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { ButtonLink } from "@/components/ui/Button";
import { useCartDetails } from "@/components/useCartDetails";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

const qtyBtn =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-line hover:bg-raised disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent";

export default function CartPage() {
  const { locale, m } = useI18n();
  const c = m.cart;
  const { lines, ready, setQty, remove } = useCart();
  const { variants, state } = useCartDetails(lines, ready);

  if (!ready || state === "loading") {
    return <p className="mx-auto max-w-3xl px-4 py-20 text-muted">{m.common.loading}</p>;
  }
  if (state === "error") {
    return <p className="mx-auto max-w-3xl px-4 py-20 text-red-400">{c.loadFailed}</p>;
  }
  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h1 className="text-3xl font-bold">{c.empty}</h1>
        <p className="mt-3 text-muted">{c.emptyHint}</p>
        <ButtonLink href="/catalog" className="mt-6">{c.toCatalog}</ButtonLink>
      </div>
    );
  }

  const rows: React.ReactNode[] = [];
  let total = 0;
  let blocked = false;

  for (const line of lines) {
    const v = variants[line.variant];
    const enough = v !== undefined && v.stock >= line.quantity;
    if (v && enough) total += Number(v.price) * line.quantity;
    else blocked = true;
    const max = v ? Math.min(v.stock, 10) : 0;

    rows.push(
      <li key={line.variant} className="flex gap-4 rounded-xl border border-line bg-surface p-4">
        <div className="relative h-20 w-20 shrink-0 rounded-lg bg-raised">
          {v?.cover && <Image src={v.cover} alt="" fill unoptimized className="object-contain p-2" />}
        </div>
        <div className="flex-1">
          {v ? (
            <>
              <Link href={`/product/${v.product_slug}`} className="font-medium hover:text-accent">
                {v.product_name}
              </Link>
              <p className="text-sm text-muted">
                {v.title || v.sku} · {m.conditions[v.condition] ?? v.condition}
              </p>
              <p className="mt-1 font-semibold">{formatPrice(v.price, locale)}</p>
              {!enough && (
                <p role="alert" className="mt-1 text-sm text-red-400">
                  {v.stock === 0 ? m.common.outOfStock : c.onlyN(v.stock)}
                </p>
              )}
            </>
          ) : (
            <p role="alert" className="text-sm text-red-400">{c.unavailable}</p>
          )}
          <div className="mt-3 flex items-center gap-3">
            {v && (
              <>
                <button type="button" aria-label={c.decrease} className={qtyBtn}
                  disabled={line.quantity <= 1} onClick={() => setQty(line.variant, line.quantity - 1)}>−</button>
                <span aria-live="polite" className="w-6 text-center text-sm">{line.quantity}</span>
                <button type="button" aria-label={c.increase} className={qtyBtn}
                  disabled={line.quantity >= max} onClick={() => setQty(line.variant, line.quantity + 1)}>+</button>
              </>
            )}
            <button type="button" onClick={() => remove(line.variant)}
              className="ml-auto text-sm text-muted hover:text-fg">{c.remove}</button>
          </div>
        </div>
      </li>,
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">{c.title}</h1>
      <ul className="mt-6 grid gap-3">{rows}</ul>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-line bg-surface p-4">
        <span className="text-muted">{c.total}</span>
        <span className="text-xl font-bold">{formatPrice(total, locale)}</span>
      </div>
      <p className="mt-2 text-xs text-muted">{c.note}</p>

      {blocked ? (
        <p className="mt-6 text-sm text-red-400">{c.blocked}</p>
      ) : (
        <ButtonLink href="/checkout" className="mt-6">{c.checkout}</ButtonLink>
      )}
    </div>
  );
}