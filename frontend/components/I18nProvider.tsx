"use client";

import { createContext, useContext, useMemo } from "react";
import { MESSAGES, type Locale, type Messages } from "@/lib/i18n";

type Ctx = { locale: Locale; m: Messages };

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, m: MESSAGES[locale] }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}