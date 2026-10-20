import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getBrands, getCategories, getProducts } from "@/lib/api";
import { getI18n } from "@/lib/i18n/server";

type SearchParams = Record<string, string | string[] | undefined>;

const FIELDS = ["q", "category", "brand", "condition", "price_min", "price_max", "ordering", "page"];
const PAGE_SIZE = 12;
const CONDITION_KEYS = ["new", "like_new", "good", "used"];

const field =
  "h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.meta.catalog };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { m } = await getI18n();
  const sp = await searchParams;
  const params: Record<string, string | undefined> = {};
  for (const f of FIELDS) {
    const v = sp[f];
    params[f] = Array.isArray(v) ? v[0] : v;
  }

  let data, categories, brands;
  try {
    [data, categories, brands] = await Promise.all([
      getProducts(params),
      getCategories(),
      getBrands(),
    ]);
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold">{m.catalog.loadFailed}</h1>
        <p className="mt-2 text-muted">{m.catalog.loadFailedHint}</p>
        <Link href="/catalog" className="mt-6 inline-block text-accent hover:underline">
          {m.catalog.resetFilters}
        </Link>
      </div>
    );
  }

  const sorts = [
    { value: "", label: m.catalog.sortNewest },
    { value: "price", label: m.catalog.sortPriceAsc },
    { value: "-price", label: m.catalog.sortPriceDesc },
    { value: "name", label: m.catalog.sortName },
  ];

  const page = Number(params.page ?? 1) || 1;
  const pages = Math.max(1, Math.ceil(data.count / PAGE_SIZE));
  const pageHref = (n: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") q.set(k, v);
    q.set("page", String(n));
    return `/catalog?${q}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">{m.catalog.title}</h1>

      <form action="/catalog" method="get" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm text-muted">
          {m.catalog.search}
          <input name="q" defaultValue={params.q} placeholder={m.catalog.searchPlaceholder} className={`${field} mt-1`} />
        </label>
        <label className="text-sm text-muted">
          {m.catalog.category}
          <select name="category" defaultValue={params.category ?? ""} className={`${field} mt-1`}>
            <option value="">{m.catalog.all}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted">
          {m.catalog.brand}
          <select name="brand" defaultValue={params.brand ?? ""} className={`${field} mt-1`}>
            <option value="">{m.catalog.all}</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted">
          {m.catalog.condition}
          <select name="condition" defaultValue={params.condition ?? ""} className={`${field} mt-1`}>
            <option value="">{m.catalog.any}</option>
            {CONDITION_KEYS.map((k) => (
              <option key={k} value={k}>{m.conditions[k]}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted">
          {m.catalog.priceFrom}
          <input name="price_min" type="number" min="0" defaultValue={params.price_min} className={`${field} mt-1`} />
        </label>
        <label className="text-sm text-muted">
          {m.catalog.priceTo}
          <input name="price_max" type="number" min="0" defaultValue={params.price_max} className={`${field} mt-1`} />
        </label>
        <label className="text-sm text-muted">
          {m.catalog.sort}
          <select name="ordering" defaultValue={params.ordering ?? ""} className={`${field} mt-1`}>
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-3">
          <button
            type="submit"
            className="h-11 flex-1 rounded-lg bg-accent px-4 text-sm font-semibold text-bg hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {m.catalog.apply}
          </button>
          <Link href="/catalog" className="flex h-11 items-center px-2 text-sm text-muted hover:text-fg">
            {m.catalog.reset}
          </Link>
        </div>
      </form>

      <p className="mt-8 text-sm text-muted">{m.catalog.found(data.count)}</p>

      {data.results.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-line bg-surface p-10 text-center">
          <p className="font-semibold">{m.catalog.nothingFound}</p>
          <p className="mt-1 text-sm text-muted">{m.catalog.nothingFoundHint}</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav aria-label={m.catalog.pages} className="mt-10 flex items-center justify-center gap-4 text-sm">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="rounded-lg border border-line px-4 py-2 hover:bg-raised">
              {m.catalog.prev}
            </Link>
          )}
          <span className="text-muted">
            {page} / {pages}
          </span>
          {page < pages && (
            <Link href={pageHref(page + 1)} className="rounded-lg border border-line px-4 py-2 hover:bg-raised">
              {m.catalog.next}
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}