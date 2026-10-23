"use client";

import Image from "next/image";
import { useI18n } from "@/components/I18nProvider";
import { Emblem } from "@/components/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { User } from "@/lib/auth-client";

export type Stats = {
  orders: number;
  repairs: number;
  trade_ins: number;
  favorites: number;
  assigned_repairs?: number;
  completed_repairs?: number;
};

export default function ProfileHeader({
  user,
  stats,
  onEdit,
  onEditCover,
}: {
  user: User;
  stats: Stats | null;
  onEdit: () => void;
  onEditCover: () => void;
}) {
  const { locale, m } = useI18n();
  const p = m.profile;
  const name = user.first_name || user.email.split("@")[0];
  const isStaff = user.role === "master" || user.role === "admin";
  const since = new Date(user.date_joined).toLocaleDateString(locale === "en" ? "en-US" : "ru-RU", {
    month: "long",
    year: "numeric",
  });

  const cards: [string, number | undefined][] = isStaff
    ? [
        [p.stats.inWork, stats?.assigned_repairs],
        [p.stats.completed, stats?.completed_repairs],
        [p.stats.orders, stats?.orders],
      ]
    : [
        [p.stats.orders, stats?.orders],
        [p.stats.repairs, stats?.repairs],
        [p.stats.tradeIns, stats?.trade_ins],
      ];

  return (
    <header>
      <div className="relative h-32 overflow-hidden rounded-2xl border border-line sm:h-44 md:h-56">
        {user.cover_url ? (
          <Image src={user.cover_url} alt="" fill unoptimized priority className="object-cover" />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(90%_140%_at_85%_0%,rgba(0,207,255,0.28),transparent_60%),linear-gradient(135deg,#0d131b,#111923)]"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
        <button
          type="button"
          onClick={onEditCover}
          className="absolute right-3 top-3 h-9 rounded-lg border border-line bg-bg/70 px-3 text-xs backdrop-blur transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-accent"
        >
          {p.upload.editCover}
        </button>
      </div>

      <div className="px-1 sm:px-4">
        <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-bg bg-surface ring-1 ring-accent/50 sm:h-28 sm:w-28">
            {user.avatar_url ? (
              <Image src={user.avatar_url} alt={p.upload.avatarAlt} fill unoptimized className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-4">
                <Emblem className="h-auto w-full" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="truncate text-2xl font-bold sm:text-3xl">{name}</h1>
            <p className="truncate text-sm text-muted">
              {user.username && <span>@{user.username}</span>}
              {user.username && user.city && " · "}
              {user.city}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full border px-3 py-1 ${
              user.email_verified ? "border-green-400/40 text-green-400" : "border-yellow-400/40 text-yellow-400"
            }`}
          >
            {user.email_verified ? p.emailVerified : p.emailNotVerified}
          </span>
          {isStaff && (
            <span className="rounded-full border border-accent/40 px-3 py-1 text-accent">
              {user.role === "master" ? p.roleMaster : p.roleAdmin}
            </span>
          )}
          <span className="text-muted">{p.memberSince(since)}</span>
        </div>

        {user.bio && <p className="mt-3 max-w-2xl text-sm text-fg/90">{user.bio}</p>}

        <dl className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {cards.map(([label, value]) => (
            <div
              key={label}
              className="flex flex-col-reverse rounded-xl border border-line bg-surface px-2 py-3 text-center sm:py-4"
            >
              <dt className="mt-1 text-xs text-muted sm:text-sm">{label}</dt>
              <dd className="text-2xl font-bold sm:text-3xl">{value ?? "–"}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <ButtonLink href="/repair">{p.actions.newRepair}</ButtonLink>
          <Button variant="secondary" onClick={onEdit}>{p.actions.editProfile}</Button>
          {isStaff && (
            <ButtonLink href="/master" variant="secondary">{p.actions.masterCabinet}</ButtonLink>
          )}
        </div>
      </div>
    </header>
  );
}