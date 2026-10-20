"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";
import { useCart } from "@/lib/cart";

export default function Header() {
  const { m } = useI18n();
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const { count } = useCart();

  const NAV = [
    { href: "/catalog", label: m.nav.catalog },
    { href: "/repair", label: m.nav.repair },
    { href: "/parts", label: m.nav.parts },
    { href: "/trade-in", label: m.nav.tradeIn },
  ];

  const navItems =
    user && (user.role === "master" || user.role === "admin")
      ? [...NAV, { href: "/master", label: m.nav.master }]
      : NAV;

  const cartLink = { href: "/cart", label: count > 0 ? m.nav.cartCount(count) : m.nav.cart };

  const authLink = loading
    ? null
    : user
      ? { href: "/account", label: m.nav.profile }
      : { href: "/auth/login", label: m.nav.login };

  const mobileItems = [
    ...navItems,
    { href: "/favorites", label: m.nav.favorites },
    cartLink,
    ...(authLink ? [authLink] : []),
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pill = "h-10 items-center rounded-lg border border-line px-4 text-sm hover:bg-raised";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo priority />

        <nav aria-label={m.nav.mainNav} className="hidden gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <Link
            href="/favorites"
            aria-label={m.nav.favorites}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line hover:bg-raised"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </Link>
          <Link href={cartLink.href} className={`flex ${pill}`}>
            {cartLink.label}
          </Link>
          {authLink && (
            <Link href={authLink.href} className={`flex ${pill}`}>
              {authLink.label}
            </Link>
          )}
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-line md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? m.nav.closeMenu : m.nav.openMenu}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {open ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label={m.nav.mobileNav}
          className="border-t border-line bg-bg px-4 py-2 md:hidden"
        >
          {mobileItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex h-12 items-center text-base text-fg"
            >
              {item.label}
            </Link>
          ))}
          <div className="py-3">
            <LanguageSwitcher className="w-fit" />
          </div>
        </nav>
      )}
    </header>
  );
}