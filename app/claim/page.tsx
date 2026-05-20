"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured, setCurrentHouseholdId } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import { formatKr } from "@/lib/utils";
import SetupNotice from "@/components/SetupNotice";

type Orphan = {
  id: string;
  name: string;
  child_count: number;
  task_count: number;
  total_balance_ore: number;
  created_at: string;
};

export default function ClaimPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [orphans, setOrphans] = useState<Orphan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("list_orphan_households");
    if (error) setError(error.message);
    else setOrphans((data as Orphan[]) ?? []);
    setLoading(false);
  }, []);

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
    setDisplayName(session.user.email?.split("@")[0] ?? "");
    load();
  }, [session, sessionLoading, router, load]);

  const claim = async (orphan: Orphan) => {
    if (!displayName.trim()) {
      setError("Skriv inn et visningsnavn først");
      return;
    }
    setBusyId(orphan.id);
    setError(null);
    const { data, error: rpcErr } = await supabase.rpc("claim_orphan_household", {
      p_household_name: orphan.name,
      p_display_name: displayName.trim(),
    });
    if (rpcErr || !data) {
      setError(rpcErr?.message ?? "Kunne ikke claime husholdningen");
      setBusyId(null);
      return;
    }
    setCurrentHouseholdId(data as string);
    router.push("/forelder");
  };

  if (!isSupabaseConfigured) return <SetupNotice />;

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-6xl animate-float">🔍</div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-6xl mb-2 animate-float">🎁</div>
          <h1 className="text-3xl font-extrabold text-purple-900">Velkommen tilbake!</h1>
          <p className="text-purple-600 font-medium">
            Vi fant {orphans.length === 1 ? "en eksisterende familie" : `${orphans.length} eksisterende familier`} du kan ta over
          </p>
        </div>

        {orphans.length === 0 ? (
          <div className="card p-6 text-center space-y-3">
            <div className="text-4xl">🤷</div>
            <p className="font-bold text-purple-900">Ingen familier å ta over</p>
            <p className="text-sm text-purple-500">
              Du må sette opp en ny familie fra scratch.
            </p>
            <Link href="/onboarding" className="btn-primary inline-block">
              Sett opp ny familie →
            </Link>
          </div>
        ) : (
          <>
            <div className="card p-4 mb-4">
              <label className="block text-sm font-bold text-purple-700 mb-1">
                Ditt visningsnavn (vises i appen)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="F.eks. Pappa"
                className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
              />
            </div>

            <div className="space-y-3">
              {orphans.map((o) => (
                <div key={o.id} className="card p-4">
                  <div className="font-extrabold text-purple-900 text-lg">{o.name}</div>
                  <div className="text-sm text-purple-600 mt-1">
                    {o.child_count} {o.child_count === 1 ? "barn" : "barn"} · {o.task_count} oppgaver
                  </div>
                  {o.total_balance_ore > 0 && (
                    <div className="bg-amber-50 rounded-xl px-3 py-2 mt-2 text-sm font-bold text-amber-900">
                      💰 Total saldo: {formatKr(o.total_balance_ore)}
                    </div>
                  )}
                  <button
                    onClick={() => claim(o)}
                    disabled={busyId === o.id || !displayName.trim()}
                    className="btn-primary w-full mt-3 disabled:opacity-50"
                  >
                    {busyId === o.id ? "Tar over..." : "✨ Ta over denne familien"}
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm font-semibold p-3 rounded-xl mt-3">
                {error}
              </div>
            )}

            <div className="text-center mt-6">
              <Link
                href="/onboarding"
                className="text-sm text-purple-500 font-semibold hover:underline"
              >
                Eller sett opp en helt ny familie →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
