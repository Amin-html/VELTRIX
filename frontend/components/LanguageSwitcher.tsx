"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

const OPTIONS: Locale[] = ["ru", "en"];

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { locale, m } = useI18n();

  function choose(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div
      role="group"
      aria-label={m.common.language}
      className={`flex overflow-hidden rounded-lg border border-line text-xs ${className}`}
    >
      {OPTIONS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={locale === l}
          className={`h-10 px-3 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
            locale === l ? "bg-raised text-fg" : "text-muted hover:text-fg"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}