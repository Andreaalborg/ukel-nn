"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured, getCurrentHouseholdId } from "@/lib/supabase";
import type { CustodyPeriod, PeriodAchievement, Profile, Task, TaskCompletion } from "@/lib/types";
import { formatKr, todayIso } from "@/lib/utils";
import { periodDays } from "@/lib/periods";
import { xpForTask, getLevel } from "@/lib/levels";
import ProfileAvatar from "@/components/ProfileAvatar";
import SetupNotice from "@/components/SetupNotice";
import PremiumGate from "@/components/PremiumGate";
import { AnimatePresence, motion } from "framer-motion";

type Draft = {
  id?: string;
  child_id: string;
  start_date: string;
  end_date: string;
  label: string;
};

export default function PeriodsPageWrapper() {
  return (
    <PremiumGate
      feature="Custody-perioder krever Premium"
      description="Definer besøksperioder for samværsforeldre — XP og bonuser regnes per besøk i stedet for kalenderuke. Tilgjengelig i Familie- og Lifetime-pakkene."
    >
      <PeriodsPage />
    </PremiumGate>
  );
}

function PeriodsPage() {
  const [kids, setKids] = useState<Profile[]>([]);
  const [periods, setPeriods] = useState<CustodyPeriod[]>([]);
  const [achievements, setAchievements] = useState<PeriodAchievement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const hid = await getCurrentHouseholdId();
    setHouseholdId(hid);
    const [kRes, pRes, aRes, tRes, cRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "child").order("sort_order"),
      supabase.from("custody_periods").select("*").order("start_date", { ascending: false }),
      supabase.from("period_achievements").select("*").order("period_end", { ascending: false }),
      supabase.from("tasks").select("*"),
      supabase.from("task_completions").select("*").eq("status", "approved"),
    ]);
    setKids((kRes.data as Profile[]) ?? []);
    setPeriods((pRes.data as CustodyPeriod[]) ?? []);
    setAchievements((aRes.data as PeriodAchievement[]) ?? []);
    setTasks((tRes.data as Task[]) ?? []);
    setCompletions((cRes.data as TaskCompletion[]) ?? []);
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
    if (!editing || !editing.child_id || !editing.start_date || !editing.end_date || !householdId) return;
    if (editing.end_date < editing.start_date) {
      alert("Slutt-dato må være etter start-dato");
      return;
    }
    const payload = {
      household_id: householdId,
      child_id: editing.child_id,
      start_date: editing.start_date,
      end_date: editing.end_date,
      label: editing.label.trim() || null,
    };
    if (editing.id) {
      await supabase.from("custody_periods").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("custody_periods").insert(payload);
    }
    setEditing(null);
    reload();
  };

  const del = async (id: string) => {
    if (!confirm("Slett perioden? (resultatene blir liggende)")) return;
    await supabase.from("custody_periods").delete().eq("id", id);
    reload();
  };

  const closePeriod = async (p: CustodyPeriod) => {
    if (!householdId) return;
    if (!confirm(`Avslutt perioden for ${kids.find((k) => k.id === p.child_id)?.name}? Dette låser inn resultatet og starter på 0 XP neste periode.`)) return;
    setBusy(p.id);
    const periodCompletions = completions.filter(
      (c) =>
        c.child_id === p.child_id &&
        c.completion_date >= p.start_date &&
        c.completion_date <= p.end_date
    );
    const xpEarned = periodCompletions.reduce((s, c) => {
      const t = tasks.find((x) => x.id === c.task_id);
      return s + xpForTask(t ?? { xp_value: 10 });
    }, 0);
    const oreEarned = periodCompletions.reduce((s, c) => s + c.reward_ore, 0);
    const lvl = getLevel(xpEarned);

    await supabase.from("period_achievements").insert({
      household_id: householdId,
      child_id: p.child_id,
      period_id: p.id,
      period_start: p.start_date,
      period_end: p.end_date,
      max_level: lvl.level,
      xp_earned: xpEarned,
      tasks_completed: periodCompletions.length,
      ore_earned: oreEarned,
      reached_max: lvl.isMax,
    });
    await supabase.from("custody_periods").update({ closed: true }).eq("id", p.id);
    setBusy(null);
    reload();
  };

  const today = todayIso();
  const periodStats = (p: CustodyPeriod) => {
    const cs = completions.filter(
      (c) => c.child_id === p.child_id && c.completion_date >= p.start_date && c.completion_date <= p.end_date
    );
    const xp = cs.reduce((s, c) => {
      const t = tasks.find((x) => x.id === c.task_id);
      return s + xpForTask(t ?? { xp_value: 10 });
    }, 0);
    const ore = cs.reduce((s, c) => s + c.reward_ore, 0);
    const lvl = getLevel(xp);
    return { cs, xp, ore, lvl };
  };

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (loading) return <div className="text-center py-12 text-4xl animate-float">📅</div>;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-900">Perioder</h1>
          <p className="text-purple-600 font-medium text-sm">
            Når er barna hos oss? Bonuser og XP regnes per periode.
          </p>
        </div>
        <button
          onClick={() =>
            setEditing({
              child_id: kids[0]?.id ?? "",
              start_date: today,
              end_date: today,
              label: "",
            })
          }
          className="btn-primary"
        >
          + Ny
        </button>
      </header>

      <div className="bg-blue-50 rounded-2xl p-3 text-xs text-blue-900 font-semibold">
        💡 Lag en periode for hvert besøk (f.eks. fredag → onsdag). Når perioden er ferdig, trykk "Avslutt" for å låse inn resultatet og starte en ny periode på 0 XP. Hvis du ikke lager perioder, brukes vanlig kalenderuke (man-søn).
      </div>

      {/* Pågående/fremtidige perioder */}
      <section>
        <h2 className="text-lg font-extrabold text-purple-900 mb-2">Aktive & fremtidige</h2>
        <div className="grid gap-3">
          <AnimatePresence>
            {periods
              .filter((p) => !p.closed)
              .map((p) => {
                const kid = kids.find((k) => k.id === p.child_id);
                const stats = periodStats(p);
                const isActive = p.start_date <= today && p.end_date >= today;
                const isFuture = p.start_date > today;
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="card p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {kid && (
                        <ProfileAvatar
                          emoji={kid.avatar_emoji}
                          color={kid.avatar_color}
                          size="sm"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-purple-900 flex items-center gap-2">
                          {kid?.name}
                          {isActive && (
                            <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              AKTIV
                            </span>
                          )}
                          {isFuture && (
                            <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              KOMMER
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-purple-500 font-medium">
                          {p.start_date} → {p.end_date} ({periodDays({ start: p.start_date, end: p.end_date, label: "", custodyId: p.id })} dager)
                        </div>
                        {p.label && (
                          <div className="text-xs text-purple-700 font-semibold mt-0.5">{p.label}</div>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setEditing({
                            id: p.id,
                            child_id: p.child_id,
                            start_date: p.start_date,
                            end_date: p.end_date,
                            label: p.label ?? "",
                          })
                        }
                        className="text-purple-500 px-1"
                      >
                        ✏️
                      </button>
                      <button onClick={() => del(p.id)} className="text-red-400 px-1">
                        🗑️
                      </button>
                    </div>
                    {isActive && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="bg-purple-50 rounded-xl py-2 text-center">
                          <div className="text-[10px] text-purple-500 font-bold">XP</div>
                          <div className="font-extrabold text-purple-900">{stats.xp}</div>
                        </div>
                        <div className="bg-purple-50 rounded-xl py-2 text-center">
                          <div className="text-[10px] text-purple-500 font-bold">Nivå</div>
                          <div className="font-extrabold text-purple-900">
                            {stats.lvl.icon} {stats.lvl.level}
                          </div>
                        </div>
                        <div className="bg-purple-50 rounded-xl py-2 text-center">
                          <div className="text-[10px] text-purple-500 font-bold">Tjent</div>
                          <div className="font-extrabold text-purple-900">{formatKr(stats.ore)}</div>
                        </div>
                      </div>
                    )}
                    {p.end_date <= today && (
                      <button
                        disabled={busy === p.id}
                        onClick={() => closePeriod(p)}
                        className="btn-success w-full mt-3"
                      >
                        ✓ Avslutt og lås inn ({stats.lvl.icon} Level {stats.lvl.level})
                      </button>
                    )}
                  </motion.div>
                );
              })}
            {periods.filter((p) => !p.closed).length === 0 && (
              <div className="card p-6 text-center">
                <div className="text-4xl mb-1">📅</div>
                <p className="font-bold text-purple-900">Ingen aktive perioder</p>
                <p className="text-sm text-purple-500">
                  Bruk vanlig kalenderuke, eller lag en periode med "+ Ny".
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Historikk */}
      {achievements.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold text-purple-900 mb-2">Historikk</h2>
          <div className="grid gap-2">
            {achievements.map((a) => {
              const kid = kids.find((k) => k.id === a.child_id);
              return (
                <div key={a.id} className="card p-3 flex items-center gap-3">
                  {kid && (
                    <ProfileAvatar
                      emoji={kid.avatar_emoji}
                      color={kid.avatar_color}
                      size="sm"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-purple-900">
                      {kid?.name} · {a.period_start} → {a.period_end}
                    </div>
                    <div className="text-xs text-purple-500">
                      {a.tasks_completed} oppgaver · {a.xp_earned} XP · {formatKr(a.ore_earned)}
                    </div>
                  </div>
                  <div
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      a.reached_max ? "bg-amber-200 text-amber-900" : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {a.reached_max ? "👑 MAX!" : `Level ${a.max_level}`}
                  </div>
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
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-extrabold text-purple-900">
                {editing.id ? "Rediger periode" : "Ny periode"}
              </h2>
              <button onClick={() => setEditing(null)} className="text-2xl text-purple-400">
                ✕
              </button>
            </div>

            <label className="block text-sm font-bold text-purple-700 mb-1">Barn</label>
            <select
              value={editing.child_id}
              onChange={(e) => setEditing({ ...editing, child_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 outline-none bg-white mb-3"
            >
              {kids.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-bold text-purple-700 mb-1">Fra</label>
                <input
                  type="date"
                  value={editing.start_date}
                  onChange={(e) => setEditing({ ...editing, start_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-purple-700 mb-1">Til</label>
                <input
                  type="date"
                  value={editing.end_date}
                  onChange={(e) => setEditing({ ...editing, end_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 outline-none"
                />
              </div>
            </div>

            <label className="block text-sm font-bold text-purple-700 mb-1">Etikett (valgfritt)</label>
            <input
              type="text"
              value={editing.label}
              onChange={(e) => setEditing({ ...editing, label: e.target.value })}
              placeholder="F.eks. Uke 19 hos pappa"
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 outline-none mb-4"
            />

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
