import type { Locale } from "@/lib/i18n";

export const CONDITIONS: Record<string, string> = {
  new: "Новый",
  like_new: "Как новый",
  good: "Хорошее",
  used: "Б/у",
};

export function formatPrice(value: string | number, locale: Locale = "ru") {
  const n = Number(value);
  return locale === "en"
    ? `${new Intl.NumberFormat("en-US").format(n)} KGS`
    : `${new Intl.NumberFormat("ru-RU").format(n)} сом`;
}