"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured, getCurrentHouseholdId } from "@/lib/supabase";
import { clearActiveProfile, getActiveProfile } from "@/lib/auth";
import { useSession } from "@/lib/useSession";
import type {
  Bonus,
  BonusClaim,
  CustodyPeriod,
  PeriodAchievement,
  Profile,
  StreakReward,
  Task,
  TaskCompletion,
} from "@/lib/types";
import { formatKr, startOfMonth, startOfWeek, todayIso } from "@/lib/utils";
import {
  describeDateRelative,
  describeRecurrence,
  getCarryOverCompletions,
  getTaskState,
} from "@/lib/scheduling";
import { getCurrentPeriod, isDateInWindow } from "@/lib/periods";
import { getLevel, xpForTask } from "@/lib/levels";
import ProfileAvatar from "@/components/ProfileAvatar";
import XpBar from "@/components/XpBar";
import LevelsModal from "@/components/LevelsModal";
import { celebrate } from "@/components/Celebrate";
import SetupNotice from "@/components/SetupNotice";
import { motion, AnimatePresence } from "framer-motion";

type TaskState = "available" | "pending" | "approved" | "rejected" | "locked";

type TaskWithState = Task & {
  state: TaskState;
  completion?: TaskCompletion;
  nextAvailableDate?: string;
};

export default function ChildPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-6xl animate-float">
          🌟
        </div>
      }
    >
      <ChildPage />
    </Suspense>
  );
}

function ChildPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { session, loading: sessionLoading, error: sessionError } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [bonusClaims, setBonusClaims] = useState<BonusClaim[]>([]);
  const [periods, setPeriods] = useState<CustodyPeriod[]>([]);
  const [achievements, setAchievements] = useState<PeriodAchievement[]>([]);
  const [streakRewards, setStreakRewards] = useState<StreakReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [showLevels, setShowLevels] = useState(false);

  const profileId = useMemo(() => {
    const fromQuery = search.get("p");
    if (fromQuery) return fromQuery;
    const active = getActiveProfile();
    return active?.id ?? null;
  }, [search]);

  const loadAll = useCallback(async () => {
    if (!profileId) return;
    const hid = await getCurrentHouseholdId();
    setHouseholdId(hid);
    const [pRes, tRes, cRes, bRes, bcRes, perRes, aRes, srRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).single(),
      supabase.from("tasks").select("*").eq("active", true).order("sort_order"),
      supabase
        .from("task_completions")
        .select("*")
        .eq("child_id", profileId)
        .order("completed_at", { ascending: false }),
      supabase.from("bonuses").select("*").eq("active", true),
      supabase.from("bonus_claims").select("*").eq("child_id", profileId),
      supabase.from("custody_periods").select("*").eq("child_id", profileId),
      supabase
        .from("period_achievements")
        .select("*")
        .eq("child_id", profileId)
        .order("period_end", { ascending: false }),
      supabase.from("streak_rewards").select("*").eq("active", true),
    ]);
    if (pRes.data) setProfile(pRes.data as Profile);
    setTasks((tRes.data as Task[]) ?? []);
    setCompletions((cRes.data as TaskCompletion[]) ?? []);
    setBonuses((bRes.data as Bonus[]) ?? []);
    setBonusClaims((bcRes.data as BonusClaim[]) ?? []);
    setPeriods((perRes.data as CustodyPeriod[]) ?? []);
    setAchievements((aRes.data as PeriodAchievement[]) ?? []);
    setStreakRewards((srRes.data as StreakReward[]) ?? []);
    setLoading(false);
  }, [profileId]);

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
    if (!profileId) {
      router.replace("/");
      return;
    }
    loadAll();
  }, [profileId, loadAll, router, session, sessionLoading]);

  const today = todayIso();
  const weekStart = startOfWeek().toISOString().slice(0, 10);
  const monthStart = startOfMonth().toISOString().slice(0, 10);

  const currentPeriod = useMemo(() => {
    if (!profileId) return null;
    return getCurrentPeriod(periods, profileId);
  }, [periods, profileId]);

  // Periode-XP: kun XP fra fullføringer godkjent i nåværende periode
  const periodXp = useMemo(() => {
    if (!currentPeriod) return 0;
    return completions
      .filter(
        (c) =>
          c.status === "approved" &&
          isDateInWindow(c.completion_date, currentPeriod)
      )
      .reduce((sum, c) => {
        const task = tasks.find((t) => t.id === c.task_id);
        return sum + xpForTask(task ?? { xp_value: 10 });
      }, 0);
  }, [completions, tasks, currentPeriod]);

  // Aktiv streak: hvor mange perioder på rad med max level
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (const a of achievements) {
      if (a.reached_max) streak++;
      else break;
    }
    if (getLevel(periodXp).isMax) streak += 1; // inkluder denne hvis vi er på max
    return streak;
  }, [achievements, periodXp]);

  const taskList: TaskWithState[] = useMemo(() => {
    return tasks
      .filter((t) => !t.assigned_to || t.assigned_to === profileId)
      .map((task) => {
        const mine = completions.filter((c) => c.child_id === profileId);
        const { state, completion, nextAvailableDate } = getTaskState(
          task,
          mine,
          today,
          weekStart
        );
        return { ...task, state, completion, nextAvailableDate };
      });
  }, [tasks, completions, profileId, today, weekStart]);

  // Carry-over: pending completions fra tidligere dager som ikke er godkjent
  const carryOvers = useMemo(() => {
    const mine = completions.filter((c) => c.child_id === profileId);
    return tasks
      .flatMap((task) =>
        getCarryOverCompletions(task, mine, today).map((completion) => ({
          task,
          completion,
        }))
      )
      .sort((a, b) =>
        b.completion.completion_date.localeCompare(a.completion.completion_date)
      );
  }, [tasks, completions, profileId, today]);

  const groupedTasks = useMemo(() => {
    return {
      available: taskList.filter((t) => t.state === "available"),
      pending: taskList.filter((t) => t.state === "pending"),
      approved: taskList.filter((t) => t.state === "approved"),
      locked: taskList.filter((t) => t.state === "locked"),
    };
  }, [taskList]);

  const todayEarned = completions
    .filter((c) => c.status === "approved" && c.completion_date === today)
    .reduce((s, c) => s + c.reward_ore, 0);

  const periodEarned = useMemo(() => {
    if (!currentPeriod) return 0;
    return completions
      .filter(
        (c) =>
          c.status === "approved" &&
          isDateInWindow(c.completion_date, currentPeriod)
      )
      .reduce((s, c) => s + c.reward_ore, 0);
  }, [completions, currentPeriod]);

  const claimTask = async (task: TaskWithState) => {
    if (!profile || !householdId || task.state !== "available") return;
    setBusy(task.id);
    const { data, error } = await supabase
      .from("task_completions")
      .insert({
        household_id: householdId,
        task_id: task.id,
        child_id: profile.id,
        reward_ore: task.reward_ore,
        completion_date: today,
        status: "pending",
      })
      .select()
      .single();
    if (!error && data) {
      setCompletions((c) => [data as TaskCompletion, ...c]);
      celebrate("small");
    }
    setBusy(null);
  };

  const unclaimTask = async (task: TaskWithState) => {
    if (!task.completion || task.state !== "pending") return;
    setBusy(task.id);
    await supabase.from("task_completions").delete().eq("id", task.completion.id);
    setCompletions((c) => c.filter((x) => x.id !== task.completion!.id));
    setBusy(null);
  };

  const bonusProgress = useCallback(
    (bonus: Bonus) => {
      if (bonus.target_child_id && bonus.target_child_id !== profileId) return null;
      const periodStart =
        bonus.period === "week"
          ? weekStart
          : bonus.period === "month"
          ? monthStart
          : bonus.period === "period"
          ? currentPeriod?.start ?? weekStart
          : bonus.start_date;
      const ends =
        bonus.period === "period" ? currentPeriod?.end ?? null : bonus.end_date;
      const inRange = (date: string) =>
        date >= periodStart && (!ends || date <= ends);

      let progress = 0;
      let goal = bonus.goal_value ?? 1;
      if (bonus.goal_type === "tasks_count") {
        progress = completions.filter(
          (c) => c.status === "approved" && inRange(c.completion_date)
        ).length;
      } else if (bonus.goal_type === "amount") {
        progress = completions
          .filter((c) => c.status === "approved" && inRange(c.completion_date))
          .reduce((s, c) => s + c.reward_ore, 0);
        goal = bonus.goal_value ?? 0;
      } else {
        progress = 0;
        goal = 1;
      }
      const pct = goal > 0 ? Math.min(100, (progress / goal) * 100) : 0;
      const claimed = bonusClaims.find(
        (c) => c.bonus_id === bonus.id && c.claimed_at >= periodStart
      );
      return { progress, goal, pct, claimed };
    },
    [completions, bonusClaims, profileId, weekStart, monthStart, currentPeriod]
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
  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-6xl animate-float">🌟</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div
        className="px-5 pt-6 pb-10 rounded-b-[2.5rem] text-white"
        style={{
          background: `linear-gradient(135deg, ${profile.avatar_color}, #8b5cf6 100%)`,
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <button
            onClick={() => {
              clearActiveProfile();
              router.push("/");
            }}
            className="text-white/80 text-sm font-semibold bg-white/20 backdrop-blur px-3 py-1.5 rounded-full"
          >
            ← Bytt
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/barn/statistikk?p=${profile.id}`)}
              className="text-white/80 text-sm font-semibold bg-white/20 backdrop-blur px-3 py-1.5 rounded-full"
            >
              📊 Stats
            </button>
            <div className="text-right">
              <div className="text-xs opacity-80 font-medium">Saldo</div>
              <div className="text-3xl font-extrabold">{formatKr(profile.balance_ore)}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <ProfileAvatar
            emoji={profile.avatar_emoji}
            color={profile.avatar_color}
            size="md"
            className="ring-4 ring-white/40"
          />
          <div className="flex-1">
            <div className="text-xs opacity-80 font-medium">Hei!</div>
            <div className="text-2xl font-extrabold">{profile.name}</div>
            {currentPeriod && (
              <div className="text-[11px] opacity-80 font-medium">
                📅 {currentPeriod.label}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur rounded-2xl p-3">
          <XpBar
            xp={periodXp}
            color={profile.avatar_color}
            variant="dark"
            onClick={() => setShowLevels(true)}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="bg-white/20 backdrop-blur rounded-2xl py-2">
            <div className="text-xs opacity-80">I dag</div>
            <div className="font-extrabold">{formatKr(todayEarned)}</div>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-2xl py-2">
            <div className="text-xs opacity-80">Periode</div>
            <div className="font-extrabold">{formatKr(periodEarned)}</div>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-2xl py-2">
            <div className="text-xs opacity-80">🔥 Streak</div>
            <div className="font-extrabold">{currentStreak}</div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
        {/* Streak-info */}
        {streakRewards.length > 0 && (
          <section>
            {streakRewards
              .filter((s) => !s.child_id || s.child_id === profileId)
              .map((s) => {
                const remaining = Math.max(0, s.required_streak - currentStreak);
                const pct = Math.min(
                  100,
                  (currentStreak / s.required_streak) * 100
                );
                return (
                  <div
                    key={s.id}
                    className="card p-4 bg-gradient-to-r from-orange-100 to-pink-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{s.icon}</div>
                      <div className="flex-1">
                        <div className="font-extrabold text-purple-900">{s.title}</div>
                        <div className="text-xs text-purple-700 font-semibold">
                          {remaining === 0
                            ? "OPPNÅDD! 🎉"
                            : `${remaining} periode${remaining > 1 ? "r" : ""} igjen for å sikre ${formatKr(s.reward_ore)}`}
                        </div>
                        <div className="h-2 bg-white/60 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 to-pink-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </section>
        )}

        {/* Bonuser */}
        {bonuses.length > 0 && (
          <section>
            <h3 className="font-extrabold text-purple-900 text-lg mb-2 flex items-center gap-2">
              🏆 Premier å sikte etter
            </h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
              {bonuses
                .filter((b) => !b.target_child_id || b.target_child_id === profileId)
                .map((b) => {
                  const prog = bonusProgress(b);
                  if (!prog) return null;
                  return (
                    <div
                      key={b.id}
                      className="card min-w-[220px] p-4 relative overflow-hidden flex-shrink-0"
                    >
                      {prog.claimed && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          OPPNÅDD!
                        </div>
                      )}
                      <div className="text-3xl mb-1">{b.icon}</div>
                      <div className="font-extrabold text-purple-900 text-sm leading-tight">{b.title}</div>
                      <div className="text-amber-600 font-bold text-lg">{formatKr(b.reward_ore)}</div>
                      <div className="mt-2 h-2 bg-purple-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${prog.pct}%`,
                            background: "linear-gradient(90deg, #f59e0b, #ec4899)",
                          }}
                        />
                      </div>
                      <div className="text-xs text-purple-500 mt-1 font-semibold">
                        {b.goal_type === "amount"
                          ? `${formatKr(prog.progress)} / ${formatKr(prog.goal)}`
                          : b.goal_type === "tasks_count"
                          ? `${prog.progress} / ${prog.goal} oppgaver`
                          : "Avgjøres av voksen"}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Klare oppgaver */}
        <section>
          <h3 className="font-extrabold text-purple-900 text-lg mb-2 flex items-center gap-2">
            🎯 Oppgaver i dag{" "}
            <span className="text-purple-400 text-sm font-medium">
              ({groupedTasks.available.length})
            </span>
          </h3>
          {groupedTasks.available.length === 0 ? (
            <div className="card p-6 text-center">
              <div className="text-4xl mb-1">🎉</div>
              <p className="font-bold text-purple-900">Alle oppgaver er gjort!</p>
              <p className="text-sm text-purple-500">Du er en superhelt i dag.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence>
                {groupedTasks.available.map((t) => (
                  <motion.button
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    whileTap={{ scale: 0.96 }}
                    disabled={busy === t.id}
                    onClick={() => claimTask(t)}
                    className="card p-4 flex items-center gap-4 text-left active:shadow-sm"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ background: `${t.color}33` }}
                    >
                      {t.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-purple-900 truncate">
                        {t.title}
                      </div>
                      {t.description && (
                        <div className="text-xs text-purple-500 truncate">
                          {t.description}
                        </div>
                      )}
                      <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400 mt-0.5">
                        {describeRecurrence(t)} · {t.xp_value} XP
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-600 font-extrabold text-lg">
                        {formatKr(t.reward_ore)}
                      </div>
                      <div className="text-xs text-purple-400 font-semibold">Trykk!</div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Venter på godkjenning (i dag + carry-over fra tidligere dager) */}
        {(groupedTasks.pending.length > 0 || carryOvers.length > 0) && (
          <section>
            <h3 className="font-extrabold text-purple-900 text-lg mb-2 flex items-center gap-2">
              ⏳ Venter på godkjenning{" "}
              <span className="text-purple-400 text-sm font-medium">
                ({groupedTasks.pending.length + carryOvers.length})
              </span>
            </h3>
            <div className="grid gap-2">
              {groupedTasks.pending.map((t) => (
                <div key={t.id} className="card p-3 flex items-center gap-3 opacity-90">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${t.color}33` }}
                  >
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-purple-900 truncate">{t.title}</div>
                    <div className="text-xs text-amber-600 font-semibold">
                      Venter på voksen...
                    </div>
                  </div>
                  <div className="text-amber-600 font-bold">{formatKr(t.reward_ore)}</div>
                  <button
                    onClick={() => unclaimTask(t)}
                    className="text-purple-400 text-xs underline"
                  >
                    Angre
                  </button>
                </div>
              ))}
              {carryOvers.map(({ task, completion }) => (
                <div
                  key={completion.id}
                  className="card p-3 flex items-center gap-3 bg-gradient-to-r from-amber-50 to-white"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${task.color}33` }}
                  >
                    {task.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-purple-900 truncate">{task.title}</div>
                    <div className="text-xs text-amber-700 font-semibold">
                      Krysset av {describeDateRelative(completion.completion_date, today)} —
                      voksen har ikke godkjent ennå
                    </div>
                  </div>
                  <div className="text-amber-600 font-bold">{formatKr(completion.reward_ore)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ferdig */}
        {groupedTasks.approved.length > 0 && (
          <section>
            <h3 className="font-extrabold text-purple-900 text-lg mb-2 flex items-center gap-2">
              ✅ Ferdig{" "}
              <span className="text-purple-400 text-sm font-medium">
                ({groupedTasks.approved.length})
              </span>
            </h3>
            <div className="grid gap-2">
              {groupedTasks.approved.map((t) => (
                <div
                  key={t.id}
                  className="card p-3 flex items-center gap-3 bg-gradient-to-r from-green-50 to-white"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-green-100">
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-purple-900 truncate line-through opacity-70">
                      {t.title}
                    </div>
                    <div className="text-xs text-green-600 font-semibold">✓ Godkjent</div>
                  </div>
                  <div className="text-green-600 font-extrabold">
                    +{formatKr(t.reward_ore)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Låst (ikke tilgjengelig akkurat nå) */}
        {groupedTasks.locked.length > 0 && (
          <section>
            <h3 className="font-extrabold text-purple-900 text-lg mb-2 flex items-center gap-2">
              🔒 Kommer senere{" "}
              <span className="text-purple-400 text-sm font-medium">
                ({groupedTasks.locked.length})
              </span>
            </h3>
            <div className="grid gap-2">
              {groupedTasks.locked.map((t) => (
                <div key={t.id} className="card p-3 flex items-center gap-3 opacity-60">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 grayscale"
                    style={{ background: `${t.color}33` }}
                  >
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-purple-900 truncate">{t.title}</div>
                    <div className="text-xs text-purple-500 font-medium">
                      {describeRecurrence(t)}
                      {t.nextAvailableDate && ` · neste: ${t.nextAvailableDate}`}
                    </div>
                  </div>
                  <div className="text-purple-400 font-bold">{formatKr(t.reward_ore)}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {showLevels && <LevelsModal xp={periodXp} onClose={() => setShowLevels(false)} />}
    </div>
  );
}
