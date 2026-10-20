"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

const ASSETS = {
  sm: { src: "/images/veltrix-emblem-sm.png", width: 192, height: 140 },
  lg: { src: "/images/veltrix-emblem.png", width: 512, height: 374 },
};

export function Emblem({
  variant = "sm",
  className = "h-8 w-auto",
  priority = false,
}: {
  variant?: "sm" | "lg";
  className?: string;
  priority?: boolean;
}) {
  const a = ASSETS[variant];
  return (
    <Image
      src={a.src}
      width={a.width}
      height={a.height}
      alt="VELTRIX"
      priority={priority}
      unoptimized
      className={`veltrix-emblem ${className}`}
    />
  );
}

export default function Logo({
  emblemClassName = "h-8 w-auto",
  textClassName = "text-lg",
  priority = false,
}: {
  emblemClassName?: string;
  textClassName?: string;
  priority?: boolean;
}) {
  const { m } = useI18n();
  return (
    <Link
      href="/"
      aria-label={m.common.homeLink}
      className="veltrix-logo-link inline-flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <Emblem className={emblemClassName} priority={priority} />
      <span className={`font-bold tracking-[0.2em] ${textClassName}`} aria-hidden="true">
        VELTRIX
      </span>
    </Link>
  );
}