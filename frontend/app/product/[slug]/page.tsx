import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "@/components/AddToCart";
import FavoriteButton from "@/components/FavoriteButton";
import { ApiError, getProduct } from "@/lib/api";
import { CONDITIONS, formatPrice } from "@/lib/format";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const abs = (u: string) => new URL(u, SITE).toString();

const CONDITION_SCHEMA: Record<string, string> = {
  new: "https://schema.org/NewCondition",
  like_new: "https://schema.org/UsedCondition",
  good: "https://schema.org/UsedCondition",
  used: "https://schema.org/UsedCondition",
};

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  try {
    return await getProduct(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const p = await load(slug);
  const description = p.description.slice(0, 160) || `${p.name} в VELTRIX`;
  const image = p.images[0]?.url;
  return {
    title: `${p.name} — VELTRIX`,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: {
      title: p.name,
      description,
      type: "website",
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await load(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    brand: { "@type": "Brand", name: product.brand.name },
    image: product.images.length ? product.images.map((i) => abs(i.url)) : undefined,
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      url: abs(`/product/${product.slug}`),
      price: v.price,
      priceCurrency: v.currency,
      itemCondition: CONDITION_SCHEMA[v.condition],
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-muted">
        <Link href="/catalog" className="hover:text-fg">Каталог</Link>
        <span className="mx-2">/</span>
        <span>{product.category.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="grid gap-3">
          {product.images.length === 0 ? (
            <div className="flex aspect-square items-center justify-center rounded-2xl border border-line bg-surface text-muted">
              Нет фото
            </div>
          ) : (
            product.images.map((img, i) => (
              <div key={img.url} className="relative aspect-square rounded-2xl border border-line bg-surface">
                <Image
                  src={img.url}
                  alt={img.alt || product.name}
                  fill
                  unoptimized
                  priority={i === 0}
                  className="object-contain p-6"
                />
              </div>
            ))
          )}
        </div>

        <div>
          <p className="text-sm uppercase tracking-wider text-muted">{product.brand.name}</p>
          <div className="mt-1 flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <FavoriteButton slug={product.slug} />
          </div>
          {product.description && <p className="mt-4 text-muted">{product.description}</p>}

          <h2 className="mt-8 text-lg font-semibold">Варианты</h2>
          <ul className="mt-3 grid gap-3">
            {product.variants.map((v) => (
              <li key={v.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{v.title || v.sku}</span>
                  <span className="text-lg font-bold">{formatPrice(v.price)}</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {CONDITIONS[v.condition] ?? v.condition}
                  {v.warranty_months > 0 && ` · гарантия ${v.warranty_months} мес.`}
                  {" · "}
                  <span className={v.stock > 0 ? "text-green-400" : ""}>
                    {v.stock > 0 ? "В наличии" : "Нет в наличии"}
                  </span>
                </p>
                <AddToCart variantId={v.id} stock={v.stock} />
              </li>
            ))}
          </ul>

          {product.attributes.length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-semibold">Характеристики</h2>
              <dl className="mt-3 divide-y divide-line rounded-xl border border-line">
                {product.attributes.map((a) => (
                  <div key={a.name} className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-muted">{a.name}</dt>
                    <dd>{a.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>
      </div>
    </div>
  );
}