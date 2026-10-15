"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/auth-client";

type State = { owner: string | null; slugs: Set<string> };
type Ctx = {
  slugs: Set<string>;
  ready: boolean;
  toggle: (slug: string) => Promise<"login" | "ok" | "error">;
};

const EMPTY = new Set<string>();
const FavoritesContext = createContext<Ctx | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<State>({ owner: null, slugs: EMPTY });
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/catalog/favorites/");
        if (!res.ok || cancelled) return;
        const list = (await res.json()) as { slug: string }[];
        setState({ owner: userId, slugs: new Set(list.map((p) => p.slug)) });
      } catch {
        /* кнопки останутся неактивными */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const ready = userId !== null && state.owner === userId;
  const slugs = ready ? state.slugs : EMPTY;

  const toggle = useCallback(
    async (slug: string) => {
      if (!userId) return "login" as const;
      const has = slugs.has(slug);
      const apply = (add: boolean) =>
        setState((s) => {
          const next = new Set<string>(s.owner === userId ? s.slugs : []);
          if (add) next.add(slug);
          else next.delete(slug);
          return { owner: userId, slugs: next };
        });
      apply(!has);
      try {
        const res = has
          ? await apiFetch(`/catalog/favorites/${slug}/`, { method: "DELETE" })
          : await apiFetch("/catalog/favorites/", { method: "POST", body: JSON.stringify({ slug }) });
        if (!res.ok) {
          apply(has);
          return "error" as const;
        }
        return "ok" as const;
      } catch {
        apply(has);
        return "error" as const;
      }
    },
    [userId, slugs],
  );

  return <FavoritesContext.Provider value={{ slugs, ready, toggle }}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside FavoritesProvider");
  return ctx;
}