"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import {
  FavoritesPanel,
  OrdersPanel,
  RepairsPanel,
  TradeInsPanel,
} from "@/components/profile/ListPanels";
import ProfileHeader, { type Stats } from "@/components/profile/ProfileHeader";
import SettingsPanel from "@/components/profile/SettingsPanel";
import Tabs from "@/components/profile/Tabs";
import { apiFetch } from "@/lib/auth-client";

const TAB_IDS = ["orders", "repairs", "tradeins", "favorites", "settings"] as const;
type TabId = (typeof TAB_IDS)[number];
const isTab = (v: string): v is TabId => (TAB_IDS as readonly string[]).includes(v);

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

export default function AccountPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { m } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const userId = user?.id;

  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash.slice(1),
    () => "",
  );
  const tab: TabId = isTab(hash) ? hash : "orders";

  const choose = useCallback((id: TabId) => {
    history.replaceState(null, "", `#${id}`);
    window.dispatchEvent(new Event("hashchange"));
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/auth/profile-stats/");
        if (!cancelled && res.ok) setStats((await res.json()) as Stats);
      } catch {
        /* в карточках останутся прочерки */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6" aria-busy="true">
        <div className="h-32 animate-pulse rounded-2xl border border-line bg-surface sm:h-44 md:h-56" />
        <div className="mt-6 h-24 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "orders", label: m.profile.tabs.orders },
    { id: "repairs", label: m.profile.tabs.repairs },
    { id: "tradeins", label: m.profile.tabs.tradeIns },
    { id: "favorites", label: m.profile.tabs.favorites },
    { id: "settings", label: m.profile.tabs.settings },
  ];

  function openSettings(scrollToMedia = false) {
    choose("settings");
    if (scrollToMedia) {
      setTimeout(() => document.getElementById("profile-media")?.scrollIntoView({ block: "start" }), 60);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <ProfileHeader
        user={user}
        stats={stats}
        onEdit={() => openSettings()}
        onEditCover={() => openSettings(true)}
      />

      <Tabs tabs={tabs} active={tab} onChange={choose} label={m.profile.tabsLabel} idPrefix="profile" />

      <div
        key={tab}
        role="tabpanel"
        id={`profile-panel-${tab}`}
        aria-labelledby={`profile-tab-${tab}`}
        tabIndex={0}
        className="tab-panel mt-6 focus-visible:outline-none"
      >
        {tab === "orders" && <OrdersPanel />}
        {tab === "repairs" && <RepairsPanel />}
        {tab === "tradeins" && <TradeInsPanel />}
        {tab === "favorites" && <FavoritesPanel />}
        {tab === "settings" && <SettingsPanel user={user} />}
      </div>
    </div>
  );
}