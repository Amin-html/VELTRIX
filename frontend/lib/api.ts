const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number) {
    super(`API error ${status}`);
    this.status = status;
  }
}

export type Brand = { id: number; name: string; slug: string };
export type Category = { id: number; name: string; slug: string; parent: string | null };

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  brand: Brand;
  category: Category;
  min_price: string;
  in_stock: boolean;
  cover: string | null;
};

export type Variant = {
  id: string;
  sku: string;
  title: string;
  condition: string;
  price: string;
  currency: string;
  stock: number;
  warranty_months: number;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: Brand;
  category: Category;
  images: { url: string; alt: string }[];
  variants: Variant[];
  attributes: { name: string; value: string }[];
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

async function get<T>(path: string, query: Record<string, string | undefined> = {}): Promise<T> {
  const url = new URL(`/api/v1${path}`, BACKEND);
  for (const [key, value] of Object.entries(query)) {
    if (value) url.searchParams.set(key, value);
  }
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new ApiError(res.status);
  return res.json() as Promise<T>;
}

export const getProducts = (query: Record<string, string | undefined>) =>
  get<Paginated<ProductListItem>>("/catalog/products/", query);
export const getProduct = (slug: string) => get<ProductDetail>(`/catalog/products/${slug}/`);
export const getCategories = () => get<Category[]>("/catalog/categories/");
export const getBrands = () => get<Brand[]>("/catalog/brands/");