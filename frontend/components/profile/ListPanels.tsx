"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFavorites } from "@/components/FavoritesProvider";
import { useI18n } from "@/components/I18nProvider";
import ProductCard from "@/components/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import type { ProductListItem } from "@/lib/api";
import { apiFetch } from "@/lib/auth-client";
import { formatPrice } from "@/lib/format";
import { shortId, type Order } from "@/lib/orders";
import { STATUS_LABEL, type Repair } from "@/lib/repairs";
import { TRADE_STATUS, type TradeIn } from "@/lib/tradein";

function useList<T>(path: string) {
  const [items, setItems] = useState<T[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(path);
        if (cancelled) return;
        if (!res.ok) return setState("error");
        setItems((await res.json()) as T[]);
        setState("ok");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path]);

  return { items, state };
}

function Skeleton() {
  return (
    <ul className="grid gap-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-[72px] animate-pulse rounded-xl border border-line bg-surface" />
      ))}
    </ul>
  );
}

function Failed() {
  const { m } = useI18n();
  return <p role="alert" className="text-sm text-red-400">{m.profile.loadFailed}</p>;
}

function Empty({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-8 text-center">
      <p className="text-muted">{text}</p>
      <ButtonLink href={href} className="mt-4">{cta}</ButtonLink>
    </div>
  );
}

function Row({
  href,
  title,
  sub,
  right,
  status,
}: {
  href: string;
  title: string;
  sub: string;
  right?: string;
  status: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span className="min-w-0">
        <span className="block truncate font-medium">{title}</span>
        <span className="text-xs text-muted">{sub}</span>
      </span>
      <span className="shrink-0 text-right">
        {right && <span className="block font-semibold">{right}</span>}
        <span className="text-sm text-accent">{status}</span>
      </span>
    </Link>
  );
}

const fmt = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "ru-RU");

export function OrdersPanel() {
  const { locale, m } = useI18n();
  const { items, state } = useList<Order>("/orders/");
  if (state === "loading") return <Skeleton />;
  if (state === "error") return <Failed />;
  if (items.length === 0) return <Empty text={m.profile.emptyOrders} href="/catalog" cta={m.profile.toCatalog} />;
  return (
    <ul className="grid gap-3">
      {items.map((o) => (
        <li key={o.id}>
          <Row
            href={`/orders/${o.id}`}
            title={m.profile.order(shortId(o.id))}
            sub={fmt(o.created_at, locale)}
            right={formatPrice(o.total, locale)}
            status={o.status_display}
          />
        </li>
      ))}
    </ul>
  );
}

export function RepairsPanel() {
  const { locale, m } = useI18n();
  const { items, state } = useList<Repair>("/repairs/");
  if (state === "loading") return <Skeleton />;
  if (state === "error") return <Failed />;
  if (items.length === 0) return <Empty text={m.profile.emptyRepairs} href="/repair" cta={m.profile.createRequest} />;
  return (
    <ul className="grid gap-3">
      {items.map((r) => (
        <li key={r.id}>
          <Row
            href={`/repair/${r.id}`}
            title={r.device}
            sub={fmt(r.created_at, locale)}
            status={STATUS_LABEL[r.status] ?? r.status_display}
          />
        </li>
      ))}
    </ul>
  );
}

export function TradeInsPanel() {
  const { locale, m } = useI18n();
  const { items, state } = useList<TradeIn>("/trade-ins/");
  if (state === "loading") return <Skeleton />;
  if (state === "error") return <Failed />;
  if (items.length === 0) return <Empty text={m.profile.emptyTradeIns} href="/trade-in" cta={m.profile.createRequest} />;
  return (
    <ul className="grid gap-3">
      {items.map((t) => (
        <li key={t.id}>
          <Row
            href={`/trade-in/${t.id}`}
            title={t.device}
            sub={fmt(t.created_at, locale)}
            status={TRADE_STATUS[t.status] ?? t.status_display}
          />
        </li>
      ))}
    </ul>
  );
}

export function FavoritesPanel() {
  const { m } = useI18n();
  const { slugs, ready } = useFavorites();
  const { items, state } = useList<ProductListItem>("/catalog/favorites/");
  if (state === "loading") return <Skeleton />;
  if (state === "error") return <Failed />;
  const visible = ready ? items.filter((p) => slugs.has(p.slug)) : items;
  if (visible.length === 0) {
    return <Empty text={m.profile.emptyFavorites} href="/catalog" cta={m.profile.toCatalog} />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}