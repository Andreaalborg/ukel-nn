"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { PeriodAchievement, Profile, StreakClaim, StreakReward } from "@/lib/types";
import { formatKr, kronerToOre } from "@/lib/utils";
import { EmojiPicker } from "@/components/EmojiPicker";
import ProfileAvatar from "@/components/ProfileAvatar";
import SetupNotice from "@/components/SetupNotice";
import { getActiveProfile } from "@/lib/auth";
import { AnimatePresence, motion } from "framer-motion";

type Draft = {
  id?: string;
  child_id: string | null;
  title: string;
  description: string;
  icon: string;
  required_streak: number;
  reward_kr: number;
  active: boolean;
};

const EMPTY: Draft = {
  child_id: null,
  title: "3-på-rad-bonus",
  description: "Nå level 10 i tre perioder på rad",
  icon: "🔥",
  required_streak: 3,
  reward_kr: 50,
  active: true,
};

export default function StreakPage() {
  const [rewards, setRewards] = useState<StreakReward[]>([]);
  const [kids, setKids] = useState<Profile[]>([]);
  const [achievements, setAchievements] = useState<PeriodAchievement[]>([]);
  const [claims, setClaims] = useState<StreakClaim[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [rRes, kRes, aRes, cRes] = await Promise.all([
      supabase.from("streak_rewards").select("*").order("created_at"),
      supabase.from("profiles").select("*").eq("role", "child").order("sort_order"),
      supabase.from("period_achievements").select("*").order("period_end", { ascending: false }),
      supabase.from("streak_claims").select("*").order("awarded_at", { ascending: false }),
    ]);
    setRewards((rRes.data as StreakReward[]) ?? []);
    setKids((kRes.data as Profile[]) ?? []);
    setAchievements((aRes.data as PeriodAchievement[]) ?? []);
    setClaims((cRes.data as StreakClaim[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    reload();
  }, [reload]);

  const save = async () => {
    if (!editing || !editing.title.trim()) return;
    const payload = {
      child_id: editing.child_id,
      title: editing.title.trim(),
      description: editing.description.trim() || null,
      icon: editing.icon,
      required_streak: Math.max(2, editing.required_streak),
      reward_ore: kronerToOre(editing.reward_kr),
      active: editing.active,
    };
    if (editing.id) {
      await supabase.from("streak_rewards").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("streak_rewards").insert(payload);
    }
    setEditing(null);
    reload();
  };

  const del = async (id: string) => {
    if (!confirm("Slette strekk-bonusen?")) return;
    await supabase.from("streak_rewards").delete().eq("id", id);
    reload();
  };

  const currentStreak = (childId: string): number => {
    let streak = 0;
    for (const a of achievements.filter((a) => a.child_id === childId)) {
      if (a.reached_max) streak++;
      else break;
    }
    return streak;
  };

  const awardStreak = async (reward: StreakReward, kid: Profile, streakCount: number) => {
    setBusy(`${reward.id}-${kid.id}`);
    const parent = getActiveProfile();
    await supabase.from("streak_claims").insert({
      streak_reward_id: reward.id,
      child_id: kid.id,
      streak_count: streakCount,
      reward_ore: reward.reward_ore,
    });
    await supabase
      .from("profiles")
      .update({ balance_ore: kid.balance_ore + reward.reward_ore })
      .eq("id", kid.id);
    setBusy(null);
    reload();
  };

  const hasClaimedThisStreak = (reward: StreakReward, childId: string, streakCount: number) => {
    // Sjekk om den nyeste claimen har samme eller høyere count enn nåværende
    const recent = claims.find((c) => c.streak_reward_id === reward.id && c.child_id === childId);
    return recent && recent.streak_count >= streakCount;
  };

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (loading) return <div className="text-center py-12 text-4xl animate-float">🔥</div>;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-900">Strekk-bonus</h1>
          <p className="text-purple-600 font-medium text-sm">
            Premier for å nå max level flere perioder på rad
          </p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary">
          + Ny
        </button>
      </header>

      <div className="bg-orange-50 rounded-2xl p-3 text-xs text-orange-900 font-semibold">
        🔥 Hvordan det virker: Når en periode avsluttes med Level 10 oppnådd, øker strekk-telleren. Når barnet når kravet (f.eks. 3 perioder på rad), kan du gi bonusen — eller den gis automatisk i historikken.
      </div>

      {/* Aktive strekk per barn */}
      <section>
        <h2 className="text-lg font-extrabold text-purple-900 mb-2">Aktive strekk</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {kids.map((kid) => {
            const streak = currentStreak(kid.id);
            return (
              <div key={kid.id} className="card p-4 flex items-center gap-3">
                <ProfileAvatar emoji={kid.avatar_emoji} color={kid.avatar_color} size="md" />
                <div className="flex-1">
                  <div className="font-extrabold text-purple-900">{kid.name}</div>
                  <div className="text-xs text-purple-500 font-semibold">Perioder på rad med Level 10</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl">🔥</div>
                  <div className="font-extrabold text-orange-600">{streak}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Konfigurerte premier */}
      <section>
        <h2 className="text-lg font-extrabold text-purple-900 mb-2">Belønninger</h2>
        <div className="grid gap-3">
          <AnimatePresence>
            {rewards.map((r) => {
              const targets = r.child_id ? kids.filter((k) => k.id === r.child_id) : kids;
              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`card p-4 ${!r.active && "opacity-50"}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-4xl">{r.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-purple-900">{r.title}</div>
                      {r.description && (
                        <div className="text-xs text-purple-500">{r.description}</div>
                      )}
                      <div className="text-xs text-purple-700 font-bold mt-1">
                        Krav: {r.required_streak} perioder på rad · Premie: {formatKr(r.reward_ore)}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setEditing({
                          id: r.id,
                          child_id: r.child_id,
                          title: r.title,
                          description: r.description ?? "",
                          icon: r.icon,
                          required_streak: r.required_streak,
                          reward_kr: r.reward_ore / 100,
                          active: r.active,
                        })
                      }
                      className="text-purple-500 px-1"
                    >
                      ✏️
                    </button>
                    <button onClick={() => del(r.id)} className="text-red-400 px-1">
                      🗑️
                    </button>
                  </div>

                  <div className="space-y-2">
                    {targets.map((kid) => {
                      const s = currentStreak(kid.id);
                      const reached = s >= r.required_streak;
                      const claimed = hasClaimedThisStreak(r, kid.id, r.required_streak);
                      const pct = Math.min(100, (s / r.required_streak) * 100);
                      return (
                        <div key={kid.id} className="flex items-center gap-3">
                          <div className="text-2xl">{kid.avatar_emoji}</div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center text-xs font-bold text-purple-700">
                              <span>{kid.name}</span>
                              <span>
                                {s} / {r.required_streak}
                              </span>
                            </div>
                            <div className="h-2 bg-purple-100 rounded-full overflow-hidden mt-0.5">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  background: reached
                                    ? "linear-gradient(90deg, #10b981, #06b6d4)"
                                    : "linear-gradient(90deg, #f59e0b, #ec4899)",
                                }}
                              />
                            </div>
                          </div>
                          {reached && !claimed && (
                            <button
                              disabled={busy === `${r.id}-${kid.id}`}
                              onClick={() => awardStreak(r, kid, s)}
                              className="text-xs font-bold bg-amber-400 text-amber-900 px-2 py-1 rounded-full active:scale-95"
                            >
                              Gi 🔥
                            </button>
                          )}
                          {claimed && (
                            <span className="text-xs font-bold text-green-600">✓ Gitt</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {rewards.length === 0 && (
            <div className="card p-6 text-center">
              <div className="text-4xl mb-1">🔥</div>
              <p className="font-bold text-purple-900">Ingen strekk-bonus enda</p>
              <p className="text-sm text-purple-500">Lag en bonus for å belønne langsiktig innsats!</p>
            </div>
          )}
        </div>
      </section>

      {/* Tildelt-historikk */}
      {claims.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold text-purple-900 mb-2">Tildelte strekk-bonuser</h2>
          <div className="grid gap-2">
            {claims.map((c) => {
              const kid = kids.find((k) => k.id === c.child_id);
              const reward = rewards.find((r) => r.id === c.streak_reward_id);
              return (
                <div key={c.id} className="card p-3 flex items-center gap-3">
                  {kid && <ProfileAvatar emoji={kid.avatar_emoji} color={kid.avatar_color} size="sm" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-purple-900">
                      {kid?.name} · {reward?.title}
                    </div>
                    <div className="text-xs text-purple-500">
                      {new Date(c.awarded_at).toLocaleDateString("nb-NO")} · {c.streak_count}-på-rad
                    </div>
                  </div>
                  <div className="font-extrabold text-amber-600">+{formatKr(c.reward_ore)}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {editing && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={() => setEditing(null)}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-extrabold text-purple-900">
                {editing.id ? "Rediger" : "Ny strekk-bonus"}
              </h2>
              <button onClick={() => setEditing(null)} className="text-2xl text-purple-400">
                ✕
              </button>
            </div>

            <label className="block text-sm font-bold text-purple-700 mb-1">Navn</label>
            <input
              type="text"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 outline-none mb-3"
            />

            <label className="block text-sm font-bold text-purple-700 mb-1">Beskrivelse</label>
            <input
              type="text"
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 outline-none mb-3"
            />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-bold text-purple-700 mb-1">
                  Krav (perioder på rad)
                </label>
                <input
                  type="number"
                  min={2}
                  value={editing.required_streak}
                  onChange={(e) =>
                    setEditing({ ...editing, required_streak: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-purple-700 mb-1">Premie (kr)</label>
                <input
                  type="number"
                  min={0}
                  value={editing.reward_kr}
                  onChange={(e) => setEditing({ ...editing, reward_kr: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 outline-none"
                />
              </div>
            </div>

            <label className="block text-sm font-bold text-purple-700 mb-1">For hvem?</label>
            <select
              value={editing.child_id ?? ""}
              onChange={(e) => setEditing({ ...editing, child_id: e.target.value || null })}
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 outline-none bg-white mb-3"
            >
              <option value="">Alle barn</option>
              {kids.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>

            <label className="block text-sm font-bold text-purple-700 mb-1">Ikon</label>
            <div className="mb-4">
              <EmojiPicker
                value={editing.icon}
                onChange={(v) => setEditing({ ...editing, icon: v })}
                type="bonus"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="btn-ghost flex-1">
                Avbryt
              </button>
              <button onClick={save} className="btn-primary flex-1">
                {editing.id ? "Lagre" : "Opprett"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
