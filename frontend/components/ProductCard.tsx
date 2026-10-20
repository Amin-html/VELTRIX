"use client";

import Image from "next/image";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import { useI18n } from "@/components/I18nProvider";
import type { ProductListItem } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export default function ProductCard({ product }: { product: ProductListItem }) {
  const { locale, m } = useI18n();
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:bg-raised">
      <Link
        href={`/product/${product.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-accent"
      >
        <div className="relative aspect-square bg-raised">
          {product.cover ? (
            <Image src={product.cover} alt={product.name} fill unoptimized className="object-contain p-4" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">{m.common.noPhoto}</div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          <p className="text-xs uppercase tracking-wider text-muted">{product.brand.name}</p>
          <h2 className="font-semibold group-hover:text-accent">{product.name}</h2>
          <p className="mt-auto pt-3 text-lg font-bold">
            {m.card.from(formatPrice(product.min_price, locale))}
          </p>
          <p className={`text-xs ${product.in_stock ? "text-green-400" : "text-muted"}`}>
            {product.in_stock ? m.common.inStock : m.common.outOfStock}
          </p>
        </div>
      </Link>
      <FavoriteButton slug={product.slug} className="absolute right-3 top-3" />
    </div>
  );
}