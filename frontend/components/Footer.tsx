import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg-2">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-bold tracking-[0.2em]">VELTRIX</p>
          <p className="mt-1 text-sm text-muted">Технологии в твоих руках</p>
        </div>
        <nav aria-label="Футер" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <Link href="/catalog" className="hover:text-fg">Каталог</Link>
          <Link href="/repair" className="hover:text-fg">Ремонт</Link>
          <Link href="/parts" className="hover:text-fg">Запчасти</Link>
          <Link href="/trade-in" className="hover:text-fg">Выкуп</Link>
        </nav>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} VELTRIX
      </div>
    </footer>
  );
}