import { ButtonLink } from "@/components/ui/Button";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { m } = await getI18n();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-3xl font-bold">{m.errors.notFoundTitle}</h1>
      <p className="mt-3 text-muted">{m.errors.notFoundText}</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/">{m.errors.home}</ButtonLink>
        <ButtonLink href="/catalog" variant="secondary">{m.errors.toCatalog}</ButtonLink>
      </div>
    </div>
  );
}