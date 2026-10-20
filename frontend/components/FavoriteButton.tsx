"use client";

import { useRouter } from "next/navigation";
import { useFavorites } from "@/components/FavoritesProvider";
import { useI18n } from "@/components/I18nProvider";

export default function FavoriteButton({ slug, className = "" }: { slug: string; className?: string }) {
  const router = useRouter();
  const { m } = useI18n();
  const { slugs, toggle } = useFavorites();
  const active = slugs.has(slug);

  async function onClick() {
    if ((await toggle(slug)) === "login") router.push("/auth/login");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? m.favorites.remove : m.favorites.add}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg/70 backdrop-blur transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-accent ${className}`}
    >
      <svg
        width="20" height="20" viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"} stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        className={active ? "text-accent" : "text-fg"}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}