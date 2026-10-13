import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth-client";
import type { CartLine } from "@/lib/cart";

export type CartVariant = {
  id: string;
  sku: string;
  title: string;
  condition: string;
  price: string;
  currency: string;
  stock: number;
  product_name: string;
  product_slug: string;
  cover: string | null;
};

export function useCartDetails(lines: CartLine[], ready: boolean) {
  const [variants, setVariants] = useState<Record<string, CartVariant>>({});
  const [fetched, setFetched] = useState<"loading" | "ok" | "error">("loading");
  const ids = lines.map((l) => l.variant).sort().join(",");

  useEffect(() => {
    if (!ready || !ids) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/catalog/variants/?ids=${ids}`);
        if (cancelled) return;
        if (!res.ok) return setFetched("error");
        const list = (await res.json()) as CartVariant[];
        setVariants(Object.fromEntries(list.map((v) => [v.id, v])));
        setFetched("ok");
      } catch {
        if (!cancelled) setFetched("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ids, ready]);

  const state = !ready ? "loading" : !ids ? "ok" : fetched;
  return { variants, state };
}