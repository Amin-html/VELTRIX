"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useFavorites } from "@/components/FavoritesProvider";
import { useI18n } from "@/components/I18nProvider";
import ProductCard from "@/components/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import type { ProductListItem } from "@/lib/api";
import { apiFetch } from "@/lib/auth-client";

export default function FavoritesPage() {
  const router = useRouter();
  const { m } = useI18n();
  const { user, loading } = useAuth();
  const { slugs, ready } = useFavorites();
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
    if (loading || !user) return;
    (async () => {
      try {
        const res = await apiFetch("/catalog/favorites/");
        if (!res.ok) return setState("error");
        setItems((await res.json()) as ProductListItem[]);
        setState("ok");
      } catch {
        setState("error");
      }
    })();
  }, [loading, user, router]);

  if (state === "loading") return <p className="mx-auto max-w-7xl px-4 py-20 text-muted">{m.common.loading}</p>;
  if (state === "error") return <p className="mx-auto max-w-7xl px-4 py-20 text-red-400">{m.profile.loadFailed}</p>;

  const visible = ready ? items.filter((p) => slugs.has(p.slug)) : items;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">{m.nav.favorites}</h1>
      {visible.length === 0 ? (
        <div className="mt-6">
          <p className="text-muted">{m.profile.emptyFavorites}</p>
          <ButtonLink href="/catalog" className="mt-4">{m.profile.toCatalog}</ButtonLink>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}