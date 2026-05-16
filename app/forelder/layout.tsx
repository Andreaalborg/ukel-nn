"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearActiveProfile, getActiveProfile } from "@/lib/auth";

const NAV = [
  { href: "/forelder", label: "Hjem", icon: "🏠" },
  { href: "/forelder/oppgaver", label: "Oppgaver", icon: "📝" },
  { href: "/forelder/perioder", label: "Perioder", icon: "📅" },
  { href: "/forelder/bonus", label: "Premier", icon: "🏆" },
  { href: "/forelder/strekk", label: "Strekk", icon: "🔥" },
  { href: "/forelder/utbetaling", label: "Utbetaling", icon: "💰" },
  { href: "/forelder/profiler", label: "Profiler", icon: "👥" },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const active = getActiveProfile();
    if (!active || active.role !== "parent") {
      router.replace("/");
      return;
    }
    setAllowed(true);
  }, [router]);

  if (!allowed) return null;

  return (
    <div className="min-h-screen pb-24 sm:pb-8 sm:pl-56">
      {/* Desktop side nav */}
      <aside className="hidden sm:flex fixed left-0 top-0 bottom-0 w-56 bg-white/80 backdrop-blur border-r border-purple-100 flex-col p-4">
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="text-2xl">🌟</div>
          <div className="font-extrabold text-purple-900">Ukeslønn</div>
        </div>
        <nav className="flex-1 space-y-1">
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
          onClick={() => {
            clearActiveProfile();
            router.push("/");
          }}
          className="text-purple-500 text-sm font-semibold py-2 hover:text-purple-700"
        >
          ← Logg ut
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-purple-100 px-1 py-1 grid grid-cols-7 z-40">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex flex-col items-center gap-0.5 py-2 rounded-lg text-[9px] font-bold ${
              path === n.href ? "text-purple-700" : "text-purple-400"
            }`}
          >
            <span className="text-lg">{n.icon}</span>
            <span className="leading-tight">{n.label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-4 sm:px-8 pt-6 pb-4 max-w-4xl mx-auto">{children}</div>
    </div>
  );
}
