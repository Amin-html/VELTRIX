import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/api";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages = ["", "/catalog", "/repair", "/trade-in", "/privacy", "/terms"].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: now,
  }));

  const products: MetadataRoute.Sitemap = [];
  try {
    for (let page = 1; page <= 20; page++) {
      const data = await getProducts({ page: String(page) });
      products.push(...data.results.map((p) => ({ url: `${SITE}/product/${p.slug}`, lastModified: now })));
      if (!data.next) break;
    }
  } catch {
    /* API недоступен: отдаём только статические страницы */
  }
  return [...pages, ...products];
}