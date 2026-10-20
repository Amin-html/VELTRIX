"use client";

import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { m } = useI18n();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-3xl font-bold">{m.errors.errorTitle}</h1>
      <p className="mt-3 text-muted">{m.errors.errorText}</p>
      <Button className="mt-8" onClick={reset}>{m.errors.retry}</Button>
    </div>
  );
}