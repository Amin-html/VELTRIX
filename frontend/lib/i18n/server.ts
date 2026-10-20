import { cookies } from "next/headers";
import { LOCALE_COOKIE, MESSAGES, type Locale } from "./index";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : "ru";
}

export async function getI18n() {
  const locale = await getLocale();
  return { locale, m: MESSAGES[locale] };
}