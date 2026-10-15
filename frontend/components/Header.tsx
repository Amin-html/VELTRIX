"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/lib/cart";
import Logo from "@/components/Logo";

const NAV = [
  { href: "/catalog", label: "Каталог" },
  { href: "/repair", label: "Ремонт" },
  { href: "/parts", label: "Запчасти" },
  { href: "/trade-in", label: "Выкуп" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const { count } = useCart();

  const navItems =
    user && (user.role === "master" || user.role === "admin")
      ? [...NAV, { href: "/master", label: "Кабинет мастера" }]
      : NAV;

  const cartLink = { href: "/cart", label: count > 0 ? `Корзина (${count})` : "Корзина" };

  const authLink = loading
    ? null
    : user
      ? { href: "/account", label: "Профиль" }
      : { href: "/auth/login", label: "Войти" };

  const mobileItems = [...navItems, cartLink, ...(authLink ? [authLink] : [])];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pill =
    "h-10 items-center rounded-lg border border-line px-4 text-sm hover:bg-raised";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo priority />

        <nav aria-label="Основная навигация" className="hidden gap-8 md:flex">
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

        <div className="hidden gap-2 md:flex">
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
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
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
          aria-label="Мобильная навигация"
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
        </nav>
      )}
    </header>
  );
}