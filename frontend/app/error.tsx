"use client";

import { Button } from "@/components/ui/Button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-3xl font-bold">Что-то пошло не так</h1>
      <p className="mt-3 text-muted">Попробуйте обновить страницу. Если ошибка повторяется, зайдите позже.</p>
      <Button className="mt-8" onClick={reset}>Повторить</Button>
    </div>
  );
}