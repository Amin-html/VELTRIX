import { useSyncExternalStore } from "react";

export type CartLine = { variant: string; quantity: number };

const KEY = "veltrix_cart";
const MAX_QTY = 10;
const EMPTY: CartLine[] = [];

function parse(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return EMPTY;
    const out: CartLine[] = [];
    for (const item of data) {
      if (item && typeof item.variant === "string" && Number.isInteger(item.quantity) && item.quantity >= 1) {
        out.push({ variant: item.variant, quantity: Math.min(item.quantity, MAX_QTY) });
      }
    }
    return out;
  } catch {
    return EMPTY;
  }
}

let cache: { raw: string | null; lines: CartLine[] } = { raw: null, lines: EMPTY };
const listeners = new Set<() => void>();

function snapshot(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* хранилище недоступно */
  }
  if (raw === cache.raw) return cache.lines;
  cache = { raw, lines: parse(raw) };
  return cache.lines;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function save(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function add(variant: string) {
  const cur = snapshot();
  const found = cur.find((l) => l.variant === variant);
  save(
    found
      ? cur.map((l) => (l.variant === variant ? { ...l, quantity: Math.min(l.quantity + 1, MAX_QTY) } : l))
      : [...cur, { variant, quantity: 1 }],
  );
}

function setQty(variant: string, quantity: number) {
  const q = Math.max(1, Math.min(quantity, MAX_QTY));
  save(snapshot().map((l) => (l.variant === variant ? { ...l, quantity: q } : l)));
}

function remove(variant: string) {
  save(snapshot().filter((l) => l.variant !== variant));
}

function clear() {
  save(EMPTY);
}

const noopSubscribe = () => () => {};

export function useCart() {
  const lines = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  return { lines, ready, count, add, setQty, remove, clear };
}