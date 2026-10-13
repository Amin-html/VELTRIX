import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

const ENTRIES = [
  { href: "/catalog", title: "Каталог техники", text: "Смартфоны, планшеты, ноутбуки и аксессуары." },
  { href: "/repair", title: "Ремонт", text: "Оставьте заявку и следите за статусом онлайн." },
  { href: "/parts", title: "Запчасти", text: "Подбор деталей по модели устройства." },
  { href: "/trade-in", title: "Выкуп", text: "Оценка вашего устройства после проверки." },
];

const BENEFITS = [
  { title: "Смета до начала работ", text: "Стоимость ремонта вы согласовываете заранее." },
  { title: "Статус заявки онлайн", text: "История этапов ремонта всегда под рукой." },
  { title: "Понятные условия", text: "Доставка, возврат и гарантия описаны на сайте." },
];

export default function Home() {
  return (
    <>
      <section className="bg-[radial-gradient(60%_50%_at_75%_0%,rgba(0,207,255,0.12),transparent)]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-32">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-accent">
            Tech / Repair / Market
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            Технологии в твоих руках
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Покупка техники, ремонт и запчасти в одном месте.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/catalog">Каталог техники</ButtonLink>
            <ButtonLink href="/repair" variant="secondary">
              Записаться на ремонт
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ENTRIES.map((e) => (
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
          {BENEFITS.map((b) => (
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