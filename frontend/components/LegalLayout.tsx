export default function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p role="note" className="mt-4 rounded-lg border border-yellow-400/40 bg-surface p-3 text-sm text-yellow-400">
        Черновик. Перед публичным запуском текст должен проверить юрист, а реквизиты и сроки
        в квадратных скобках нужно заполнить.
      </p>
      <div className="mt-8 space-y-6 text-muted [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-fg [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}