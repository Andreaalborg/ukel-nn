"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Payout, Profile } from "@/lib/types";
import { formatKr, kronerToOre } from "@/lib/utils";
import ProfileAvatar from "@/components/ProfileAvatar";
import SetupNotice from "@/components/SetupNotice";
import { getActiveProfile } from "@/lib/auth";

export default function PayoutsPage() {
  const [kids, setKids] = useState<Profile[]>([]);
  const [history, setHistory] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<{ kid: Profile; amount: number; note: string } | null>(null);

  const reload = useCallback(async () => {
    const [kRes, hRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "child").order("sort_order"),
      supabase.from("payouts").select("*").order("paid_at", { ascending: false }).limit(20),
    ]);
    setKids((kRes.data as Profile[]) ?? []);
    setHistory((hRes.data as Payout[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    reload();
  }, [reload]);

  const handlePayout = async () => {
    if (!confirming) return;
    const { kid, amount, note } = confirming;
    const parent = getActiveProfile();
    await supabase.from("payouts").insert({
      child_id: kid.id,
      amount_ore: amount,
      note: note || null,
      paid_by: parent?.id ?? null,
    });
    await supabase.from("profiles").update({ balance_ore: kid.balance_ore - amount }).eq("id", kid.id);
    setConfirming(null);
    reload();
  };

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (loading) return <div className="text-center py-12 text-4xl animate-float">💰</div>;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-extrabold text-purple-900">Utbetaling</h1>
        <p className="text-purple-600 font-medium text-sm">
          Når du har betalt ut ekte penger, trykk her for å nullstille saldoen.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {kids.map((kid) => (
          <div key={kid.id} className="card p-4 flex items-center gap-4">
            <ProfileAvatar emoji={kid.avatar_emoji} color={kid.avatar_color} size="md" />
            <div className="flex-1">
              <div className="font-extrabold text-purple-900 text-lg">{kid.name}</div>
              <div className="text-2xl font-extrabold text-purple-900">{formatKr(kid.balance_ore)}</div>
            </div>
            <button
              disabled={kid.balance_ore === 0}
              onClick={() => setConfirming({ kid, amount: kid.balance_ore, note: "" })}
              className="btn-success disabled:opacity-30"
            >
              Betal ut
            </button>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-xl font-extrabold text-purple-900 mb-2">Historikk</h2>
        {history.length === 0 ? (
          <div className="card p-4 text-center text-purple-500 font-medium">Ingen utbetalinger enda.</div>
        ) : (
          <div className="space-y-2">
            {history.map((p) => {
              const kid = kids.find((k) => k.id === p.child_id);
              return (
                <div key={p.id} className="card p-3 flex items-center gap-3">
                  {kid && <ProfileAvatar emoji={kid.avatar_emoji} color={kid.avatar_color} size="sm" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-purple-900">{kid?.name ?? "?"}</div>
                    <div className="text-xs text-purple-500">
                      {new Date(p.paid_at).toLocaleString("nb-NO")}
                      {p.note && ` · ${p.note}`}
                    </div>
                  </div>
                  <div className="font-extrabold text-green-600">-{formatKr(p.amount_ore)}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {confirming && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setConfirming(null)}>
          <div
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <ProfileAvatar emoji={confirming.kid.avatar_emoji} color={confirming.kid.avatar_color} size="md" className="mx-auto mb-2" />
              <h2 className="text-xl font-extrabold text-purple-900">Betal ut til {confirming.kid.name}</h2>
              <p className="text-purple-600 text-sm">Total saldo: {formatKr(confirming.kid.balance_ore)}</p>
            </div>

            <label className="block text-sm font-bold text-purple-700 mb-1">Beløp som betales ut (kr)</label>
            <input
              type="number"
              min={0}
              max={confirming.kid.balance_ore / 100}
              value={confirming.amount / 100}
              onChange={(e) =>
                setConfirming({
                  ...confirming,
                  amount: Math.min(confirming.kid.balance_ore, kronerToOre(Number(e.target.value))),
                })
              }
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none mb-3"
            />

            <label className="block text-sm font-bold text-purple-700 mb-1">Notat (valgfritt)</label>
            <input
              type="text"
              value={confirming.note}
              onChange={(e) => setConfirming({ ...confirming, note: e.target.value })}
              placeholder="F.eks. Lørdagsutbetaling"
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none mb-4"
            />

            <div className="flex gap-2">
              <button onClick={() => setConfirming(null)} className="btn-ghost flex-1">Avbryt</button>
              <button onClick={handlePayout} className="btn-success flex-1">
                Bekreft utbetaling
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
