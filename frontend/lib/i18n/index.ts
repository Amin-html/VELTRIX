import { en } from "./en";
import { ru, type Messages } from "./ru";

export type { Messages };
export type Locale = "ru" | "en";

export const LOCALE_COOKIE = "locale";
export const MESSAGES: Record<Locale, Messages> = { ru, en };