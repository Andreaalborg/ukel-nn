"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveProfile } from "@/lib/auth";
import { useSession } from "@/lib/useSession";
import { getCurrentHouseholdId } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, loading, error: sessionError } = useSession();
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
      // Krever aktiv forelder-sesjon (ikke bare «ikke barn» / manglende profil)
      const active = getActiveProfile();
      if (!active || active.role !== "parent") {
        router.replace("/");
        return;
      }
      setAllowed(true);
    })();
  }, [session, loading, router]);

  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-6 max-w-md text-center space-y-3">
          <div className="text-5xl">😴</div>
          <h2 className="text-xl font-bold text-purple-900">Mistet kontakt med serveren</h2>
          <p className="text-purple-700 text-sm">{sessionError}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Last på nytt
          </button>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-6xl animate-float">🌟</div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
