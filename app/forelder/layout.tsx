"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout, getActiveProfile } from "@/lib/auth";
import { useSession } from "@/lib/useSession";
import { getCurrentHouseholdId } from "@/lib/supabase";

const NAV = [
  { href: "/forelder", label: "Hjem", icon: "🏠" },
  { href: "/forelder/oppgaver", label: "Oppgaver", icon: "📝" },
  { href: "/forelder/perioder", label: "Perioder", icon: "📅" },
  { href: "/forelder/bonus", label: "Premier", icon: "🏆" },
  { href: "/forelder/strekk", label: "Strekk", icon: "🔥" },
  { href: "/forelder/statistikk", label: "Stats", icon: "📊" },
  { href: "/forelder/utbetaling", label: "Utbetaling", icon: "💰" },
  { href: "/forelder/profiler", label: "Profiler", icon: "👥" },
  { href: "/forelder/innstillinger", label: "Innstillinger", icon: "⚙️" },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { session, loading } = useSession();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/auth/signin");
      return;
    }
    (async () => {
      const hid = await getCurrentHouseholdId();
      if (!hid) {
        router.replace("/onboarding");
        return;
      }
      // Sjekk at den valgte PIN-profilen er parent (hvis satt)
      const active = getActiveProfile();
      if (active && active.role !== "parent") {
        // Barn skal ikke være her
        router.replace("/");
        return;
      }
      setAllowed(true);
    })();
  }, [session, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/signin");
  };

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-6xl animate-float">🌟</div>
    );
  }

  return (
    <div className="min-h-screen pb-24 sm:pb-8 sm:pl-56" style={{ paddingBottom: "max(6rem, env(safe-area-inset-bottom) + 5rem)" }}>
      {/* Desktop side nav */}
      <aside className="hidden sm:flex fixed left-0 top-0 bottom-0 w-56 bg-white/80 backdrop-blur border-r border-purple-100 flex-col p-4">
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="text-2xl">🌟</div>
          <div className="font-extrabold text-purple-900">Ukeslønn</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {NAV.map((n) => (
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
        <button
          onClick={handleLogout}
          className="text-purple-500 text-sm font-semibold py-2 hover:text-purple-700 text-left px-3"
        >
          ← Logg ut
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-purple-100 z-40 overflow-x-auto no-scrollbar"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex px-2 py-1 min-w-max">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg text-[10px] font-bold min-w-[60px] ${
                path === n.href ? "text-purple-700 bg-purple-50" : "text-purple-400"
              }`}
            >
              <span className="text-lg">{n.icon}</span>
              <span className="leading-tight whitespace-nowrap">{n.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="px-4 sm:px-8 pt-6 pb-4 max-w-4xl mx-auto" style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}>
        {children}
      </div>
    </div>
  );
}
