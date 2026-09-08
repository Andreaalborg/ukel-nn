"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearActiveProfile, logout } from "@/lib/auth";
import MoreMenu from "@/components/MoreMenu";

export const PRIMARY_NAV = [
  { href: "/forelder", label: "Hjem", icon: "🏠" },
  { href: "/forelder/oppgaver", label: "Oppgaver", icon: "📝" },
  { href: "/forelder/bonus", label: "Premier", icon: "🏆" },
  { href: "/forelder/utbetaling", label: "Utbetaling", icon: "💰" },
];

export const SECONDARY_NAV = [
  { href: "/dagsplan", label: "Dagsplan", icon: "🗓️" },
  { href: "/forelder/perioder", label: "Perioder", icon: "📅" },
  { href: "/forelder/strekk", label: "Streak", icon: "🔥" },
  { href: "/forelder/statistikk", label: "Statistikk", icon: "📊" },
  { href: "/forelder/profiler", label: "Profiler", icon: "👥" },
  { href: "/forelder/oppgrader", label: "Oppgrader", icon: "💎" },
  { href: "/forelder/innstillinger", label: "Innstillinger", icon: "⚙️" },
];

const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

/**
 * Persistent app-skall (sidemeny på desktop, bunnmeny på mobil) for
 * innloggede voksne. Rendrer KUN navigasjons-chrome — ingen auth-sjekk
 * her, det gjør hver side/layout selv før den evt. tar i bruk skallet.
 */
export default function AppShell({
  children,
  wide,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  const router = useRouter();
  const path = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/signin");
  };

  const handleSwitchProfile = () => {
    clearActiveProfile();
    router.push("/");
  };

  const moreItems = [
    ...SECONDARY_NAV.map((n) => ({ href: n.href, label: n.label, icon: n.icon })),
    { label: "Bytt profil", icon: "🔄", onClick: handleSwitchProfile },
    { label: "Logg ut", icon: "🚪", onClick: handleLogout, danger: true },
  ];

  return (
    <div
      className="min-h-screen pb-24 sm:pb-8 sm:pl-56"
      style={{ paddingBottom: "max(6rem, env(safe-area-inset-bottom) + 5rem)" }}
    >
      {/* Mobile top bar — Bytt-knapp synlig */}
      <header className="sm:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-purple-100 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌟</span>
          <span className="font-extrabold text-purple-900">Ukeslønn</span>
        </div>
        <button
          onClick={handleSwitchProfile}
          className="text-purple-600 text-sm font-bold bg-purple-50 px-3 py-1.5 rounded-full"
        >
          🔄 Bytt
        </button>
      </header>

      {/* Desktop side nav */}
      <aside className="hidden sm:flex fixed left-0 top-0 bottom-0 w-56 bg-white/80 backdrop-blur border-r border-purple-100 flex-col p-4 z-30">
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="text-2xl">🌟</div>
          <div className="font-extrabold text-purple-900">Ukeslønn</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {ALL_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl font-semibold ${
                path === n.href
                  ? "bg-purple-100 text-purple-900"
                  : "text-purple-700 hover:bg-purple-50"
              }`}
            >
              <span className="text-xl">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 pt-2 border-t border-purple-100">
          <button
            onClick={handleSwitchProfile}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-semibold text-purple-700 hover:bg-purple-50"
          >
            <span className="text-xl">🔄</span>
            Bytt profil
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-semibold text-red-600 hover:bg-red-50"
          >
            <span className="text-xl">🚪</span>
            Logg ut
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav: 4 primære + Mer */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-purple-100 z-40"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5 px-1 py-1">
          {PRIMARY_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] font-bold ${
                path === n.href ? "text-purple-700 bg-purple-50" : "text-purple-400"
              }`}
            >
              <span className="text-lg">{n.icon}</span>
              <span className="leading-tight">{n.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] font-bold text-purple-400"
          >
            <span className="text-lg">☰</span>
            <span className="leading-tight">Mer</span>
          </button>
        </div>
      </nav>

      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} items={moreItems} />

      <div
        className={`px-4 sm:px-8 pt-6 pb-4 mx-auto ${wide ? "max-w-6xl" : "max-w-4xl"}`}
      >
        {children}
      </div>
    </div>
  );
}
