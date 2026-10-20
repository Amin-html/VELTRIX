import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { getI18n } from "@/lib/i18n/server";

export default async function Home() {
  const { m } = await getI18n();
  const entries = [
    { href: "/catalog", ...m.home.entries.catalog },
    { href: "/repair", ...m.home.entries.repair },
    { href: "/parts", ...m.home.entries.parts },
    { href: "/trade-in", ...m.home.entries.tradeIn },
  ];
  const benefits = [m.home.benefits.quote, m.home.benefits.status, m.home.benefits.terms];

  return (
    <>
      <section className="bg-[radial-gradient(60%_50%_at_75%_0%,rgba(0,207,255,0.12),transparent)]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-32">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-accent">
            {m.home.eyebrow}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            {m.home.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">{m.home.subtitle}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/catalog">{m.home.ctaCatalog}</ButtonLink>
            <ButtonLink href="/repair" variant="secondary">{m.home.ctaRepair}</ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {entries.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="group rounded-2xl border border-line bg-surface p-6 transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-accent"
            >
              <h2 className="text-lg font-semibold group-hover:text-accent">{e.title}</h2>
              <p className="mt-2 text-sm text-muted">{e.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-bg-2">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title}>
              <h3 className="font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}