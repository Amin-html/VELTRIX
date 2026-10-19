import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Страница не найдена — VELTRIX" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-3xl font-bold">Страница не найдена</h1>
      <p className="mt-3 text-muted">Ссылка могла устареть, а товар быть снят с продажи.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/">На главную</ButtonLink>
        <ButtonLink href="/catalog" variant="secondary">В каталог</ButtonLink>
      </div>
    </div>
  );
}