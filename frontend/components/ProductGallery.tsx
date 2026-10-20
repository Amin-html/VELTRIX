"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type Img = { url: string; alt: string };

const arrow =
  "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-bg/70 backdrop-blur transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-30";

export default function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const { m } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-line bg-surface text-muted">
        {m.common.noPhoto}
      </div>
    );
  }

  const last = images.length - 1;

  function go(i: number) {
    const el = track.current;
    if (!el) return;
    const target = Math.max(0, Math.min(i, last));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: target * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  }

  function onScroll() {
    const el = track.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.max(0, Math.min(Math.round(el.scrollLeft / el.clientWidth), last)));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    }
  }

  return (
    <div>
      <div className="relative">
        <div
          ref={track}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={m.gallery.label(name)}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl border border-line bg-surface [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <div key={img.url} className="relative aspect-square w-full shrink-0 snap-center">
              <Image
                src={img.url}
                alt={img.alt || (last > 0 ? m.gallery.photoN(name, i + 1) : name)}
                fill
                unoptimized
                priority={i === 0}
                className="object-contain p-6"
              />
            </div>
          ))}
        </div>

        {last > 0 && (
          <>
            <button
              type="button"
              aria-label={m.gallery.prev}
              disabled={index === 0}
              onClick={() => go(index - 1)}
              className={`${arrow} left-3`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={m.gallery.next}
              disabled={index === last}
              onClick={() => go(index + 1)}
              className={`${arrow} right-3`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
            <p
              aria-live="polite"
              className="absolute bottom-3 right-3 rounded-full bg-bg/70 px-3 py-1 text-xs text-fg backdrop-blur"
            >
              {index + 1} / {images.length}
            </p>
          </>
        )}
      </div>

      {last > 0 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={m.gallery.showPhoto(i + 1)}
                aria-current={i === index}
                className={`relative block h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-surface focus-visible:outline-2 focus-visible:outline-accent ${
                  i === index ? "border-accent" : "border-line"
                }`}
              >
                <Image src={img.url} alt="" fill unoptimized className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}