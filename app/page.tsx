"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase, getCurrentHouseholdId, setCurrentHouseholdId } from "@/lib/supabase";
import { setActiveProfile } from "@/lib/auth";
import type { Profile } from "@/lib/types";
import ProfileAvatar from "@/components/ProfileAvatar";
import PinPad from "@/components/PinPad";
import SetupNotice from "@/components/SetupNotice";
import LegalFooter from "@/components/LegalFooter";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "@/lib/useSession";

export default function Home() {
  const router = useRouter();
  const { session, loading: sessionLoading, error: sessionError } = useSession();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [resetPin, setResetPin] = useState(0);

  const loadProfiles = useCallback(async () => {
    if (!session) return;

    // 1) Hvilke husholdninger er denne brukeren medlem av?
    const { data: memberships } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", session.user.id);

    if (!memberships || memberships.length === 0) {
      // Ikke medlem av noe — sjekk om det finnes foreldreløse husholdninger å claime
      const { data: orphans } = await supabase.rpc("list_orphan_households");
      if (orphans && (orphans as unknown[]).length > 0) {
        router.replace("/claim");
      } else {
        router.replace("/onboarding");
      }
      return;
    }

    // 2) Velg cached husholdning hvis fortsatt gyldig, ellers den første
    const memberIds = memberships.map((m) => m.household_id as string);
    const hid = await getCurrentHouseholdId();
    const useHid = hid && memberIds.includes(hid) ? hid : memberIds[0];

    // 3) Hent profiler
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("household_id", useHid)
      .order("sort_order");

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // 4) Hvis husholdningen er tom for profiler (sjeldent), gå til wizarden
    if ((data?.length ?? 0) === 0) {
      router.replace("/onboarding");
      return;
    }

    setProfiles((data as Profile[]) ?? []);
    setLoading(false);
  }, [session, router]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    if (sessionLoading) return;
    if (!session) {
      router.replace("/auth/signin");
      return;
    }
    loadProfiles();
  }, [session, sessionLoading, router, loadProfiles]);

  const handlePin = useCallback(
    (pin: string) => {
      if (!selected) return;
      if (pin === selected.pin) {
        setActiveProfile(selected);
        setCurrentHouseholdId(selected.household_id);
        if (selected.role === "parent") router.push("/forelder");
        else router.push(`/barn?p=${selected.id}`);
      } else {
        setPinError("Feil PIN-kode, prøv igjen");
        setResetPin((r) => r + 1);
        setTimeout(() => setPinError(null), 1500);
      }
    },
    [selected, router]
  );

  if (!isSupabaseConfigured) return <SetupNotice />;

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

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-6xl animate-float">🌟</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-8 max-w-md text-center space-y-3">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-purple-900">Noe gikk galt</h2>
          <p className="text-purple-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {!selected ? (
          <motion.div
            key="picker"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md text-center"
          >
            <div className="text-6xl mb-3 animate-float">🌟</div>
            <h1 className="text-4xl font-extrabold text-purple-900 mb-1">Ukeslønn</h1>
            <p className="text-purple-600 mb-10 font-medium">Hvem er du?</p>
            <div className="space-y-3">
              {profiles.map((p) => (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelected(p)}
                  className="card w-full p-4 flex items-center gap-4 hover:shadow-xl transition-shadow"
                >
                  <ProfileAvatar emoji={p.avatar_emoji} color={p.avatar_color} size="md" />
                  <div className="text-left flex-1">
                    <div className="text-xl font-extrabold text-purple-900">{p.name}</div>
                    <div className="text-sm font-medium text-purple-500">
                      {p.role === "parent" ? "👑 Voksen" : "🎮 Barn"}
                    </div>
                  </div>
                  <div className="text-purple-300 text-2xl">→</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pin"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md text-center"
          >
            <button
              onClick={() => setSelected(null)}
              className="text-purple-500 font-semibold mb-6 hover:text-purple-700"
            >
              ← Bytt profil
            </button>
            <div className="flex justify-center mb-3">
              <ProfileAvatar emoji={selected.avatar_emoji} color={selected.avatar_color} size="lg" />
            </div>
            <h2 className="text-2xl font-extrabold text-purple-900 mb-1">Hei, {selected.name}!</h2>
            <p className="text-purple-600 mb-6 font-medium">Tast inn PIN-koden din</p>
            <PinPad onComplete={handlePin} error={pinError} reset={resetPin} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-12">
        <LegalFooter />
      </div>
    </div>
  );
}
