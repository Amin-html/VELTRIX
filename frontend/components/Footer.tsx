import Link from "next/link";
import Logo from "@/components/Logo";
import { getI18n } from "@/lib/i18n/server";

export default async function Footer() {
  const { m } = await getI18n();
  const links = [
    { href: "/catalog", label: m.nav.catalog },
    { href: "/repair", label: m.nav.repair },
    { href: "/parts", label: m.nav.parts },
    { href: "/trade-in", label: m.nav.tradeIn },
  ];

  return (
    <footer className="border-t border-line bg-bg-2">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo emblemClassName="h-6 w-auto" textClassName="text-base" />
          <p className="mt-1 text-sm text-muted">{m.footer.tagline}</p>
        </div>
        <nav aria-label={m.nav.footerNav} className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-fg">{l.label}</Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <Link href="/privacy" className="hover:text-fg">{m.footer.privacy}</Link>
          <Link href="/terms" className="hover:text-fg">{m.footer.terms}</Link>
        </div>
        <p className="mt-2">© {new Date().getFullYear()} VELTRIX</p>
      </div>
    </footer>
  );
}