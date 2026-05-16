"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type {
  BonusClaim,
  CustodyPeriod,
  PeriodAchievement,
  Profile,
  StreakReward,
  Task,
  TaskCompletion,
} from "@/lib/types";
import { formatKr, greeting, startOfWeek, todayIso } from "@/lib/utils";
import { xpForTask, getLevel } from "@/lib/levels";
import { getCurrentPeriod, isDateInWindow } from "@/lib/periods";
import ProfileAvatar from "@/components/ProfileAvatar";
import XpBar from "@/components/XpBar";
import SetupNotice from "@/components/SetupNotice";
import { getActiveProfile } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";

type PendingCompletionRow = TaskCompletion & {
  tasks: Task | null;
  profiles: Profile | null;
};

export default function ParentHome() {
  const [parentId, setParentId] = useState<string | null>(null);
  const [kids, setKids] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pending, setPending] = useState<PendingCompletionRow[]>([]);
  const [pendingBonus, setPendingBonus] = useState<
    (BonusClaim & { profiles: Profile | null; bonuses: { title: string; icon: string } | null })[]
  >([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [periods, setPeriods] = useState<CustodyPeriod[]>([]);
  const [achievements, setAchievements] = useState<PeriodAchievement[]>([]);
  const [streakRewards, setStreakRewards] = useState<StreakReward[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const a = getActiveProfile();
    setParentId(a?.id ?? null);
  }, []);

  const today = todayIso();
  const weekStart = useMemo(() => startOfWeek().toISOString().slice(0, 10), []);

  const reload = useCallback(async () => {
    const [kidsRes, tasksRes, pendingRes, bonusRes, completionsRes, perRes, achRes, srRes] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("role", "child").order("sort_order"),
        supabase.from("tasks").select("*"),
        supabase
          .from("task_completions")
          .select("*, tasks(*), profiles!task_completions_child_id_fkey(*)")
          .eq("status", "pending")
          .order("completed_at"),
        supabase
          .from("bonus_claims")
          .select("*, profiles!bonus_claims_child_id_fkey(*), bonuses(title, icon)")
          .eq("status", "pending")
          .order("claimed_at"),
        supabase
          .from("task_completions")
          .select("*")
          .eq("status", "approved")
          .gte("completion_date", weekStart),
        supabase.from("custody_periods").select("*"),
        supabase.from("period_achievements").select("*").order("period_end", { ascending: false }),
        supabase.from("streak_rewards").select("*").eq("active", true),
      ]);
    setKids((kidsRes.data as Profile[]) ?? []);
    setTasks((tasksRes.data as Task[]) ?? []);
    setPending((pendingRes.data as PendingCompletionRow[]) ?? []);
    setPendingBonus((bonusRes.data as never) ?? []);
    setCompletions((completionsRes.data as TaskCompletion[]) ?? []);
    setPeriods((perRes.data as CustodyPeriod[]) ?? []);
    setAchievements((achRes.data as PeriodAchievement[]) ?? []);
    setStreakRewards((srRes.data as StreakReward[]) ?? []);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    reload();
  }, [reload]);

  const reviewTask = async (row: PendingCompletionRow, approve: boolean) => {
    setBusy(row.id);
    const newStatus = approve ? "approved" : "rejected";
    const { error } = await supabase
      .from("task_completions")
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: parentId,
      })
      .eq("id", row.id);

    if (!error && approve && row.profiles) {
      // XP er periodebasert (regnes fra completions), så her oppdaterer vi kun saldo
      await supabase
        .from("profiles")
        .update({ balance_ore: row.profiles.balance_ore + row.reward_ore })
        .eq("id", row.profiles.id);
    }
    setBusy(null);
    reload();
  };

  const reviewBonus = async (claim: (typeof pendingBonus)[number], approve: boolean) => {
    setBusy(claim.id);
    if (approve) {
      await supabase
        .from("bonus_claims")
        .update({ status: "approved", reviewed_by: parentId })
        .eq("id", claim.id);
      if (claim.profiles) {
        await supabase
          .from("profiles")
          .update({ balance_ore: claim.profiles.balance_ore + claim.reward_ore })
          .eq("id", claim.profiles.id);
      }
    } else {
      await supabase.from("bonus_claims").delete().eq("id", claim.id);
    }
    setBusy(null);
    reload();
  };

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (loading) return <div className="text-center py-12 text-4xl animate-float">🌟</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-purple-900">{greeting()}! 👋</h1>
        <p className="text-purple-600 font-medium">Her er familieoversikten</p>
      </header>

      {/* Kid stats */}
      <section className="grid sm:grid-cols-2 gap-4">
        {kids.map((kid) => {
          const period = getCurrentPeriod(periods, kid.id);
          const inPeriod = (c: TaskCompletion) =>
            isDateInWindow(c.completion_date, period);
          const todayKr = completions
            .filter((c) => c.child_id === kid.id && c.completion_date === today)
            .reduce((s, c) => s + c.reward_ore, 0);
          const periodKr = completions
            .filter((c) => c.child_id === kid.id && inPeriod(c))
            .reduce((s, c) => s + c.reward_ore, 0);
          const periodXp = completions
            .filter((c) => c.child_id === kid.id && inPeriod(c))
            .reduce((s, c) => {
              const t = tasks.find((x) => x.id === c.task_id);
              return s + xpForTask(t ?? { xp_value: 10 });
            }, 0);
          let streak = 0;
          for (const a of achievements.filter((a) => a.child_id === kid.id)) {
            if (a.reached_max) streak++;
            else break;
          }
          if (getLevel(periodXp).isMax) streak += 1;
          return (
            <div key={kid.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <ProfileAvatar
                  emoji={kid.avatar_emoji}
                  color={kid.avatar_color}
                  size="md"
                />
                <div className="flex-1">
                  <div className="font-extrabold text-purple-900 text-xl">{kid.name}</div>
                  <div className="text-sm text-purple-500 font-medium">Saldo</div>
                  <div className="text-2xl font-extrabold text-purple-900">
                    {formatKr(kid.balance_ore)}
                  </div>
                </div>
                {streak > 0 && (
                  <div className="text-center">
                    <div className="text-2xl">🔥</div>
                    <div className="text-xs font-extrabold text-orange-600">{streak}</div>
                  </div>
                )}
              </div>
              <div className="text-[10px] text-purple-500 font-bold mb-1">
                📅 {period.label}
              </div>
              <XpBar xp={periodXp} color={kid.avatar_color} variant="light" />
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-purple-50 rounded-xl py-2 text-center">
                  <div className="text-xs text-purple-500 font-semibold">I dag</div>
                  <div className="font-extrabold text-purple-900">{formatKr(todayKr)}</div>
                </div>
                <div className="bg-purple-50 rounded-xl py-2 text-center">
                  <div className="text-xs text-purple-500 font-semibold">Perioden</div>
                  <div className="font-extrabold text-purple-900">{formatKr(periodKr)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Pending approvals */}
      <section>
        <h2 className="text-xl font-extrabold text-purple-900 mb-3 flex items-center gap-2">
          ✋ Venter på godkjenning
          {pending.length + pendingBonus.length > 0 && (
            <span className="bg-amber-400 text-amber-900 text-xs px-2 py-0.5 rounded-full">
              {pending.length + pendingBonus.length}
            </span>
          )}
        </h2>
        {pending.length === 0 && pendingBonus.length === 0 ? (
          <div className="card p-6 text-center">
            <div className="text-4xl mb-1">😎</div>
            <p className="font-bold text-purple-900">Alt er gjort opp!</p>
            <p className="text-sm text-purple-500">Ingen oppgaver venter på godkjenning.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {pending.map((row) => (
                <motion.div
                  key={row.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="card p-3 flex items-center gap-3"
                >
                  {row.profiles && (
                    <ProfileAvatar
                      emoji={row.profiles.avatar_emoji}
                      color={row.profiles.avatar_color}
                      size="sm"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-purple-900 truncate">
                      {row.tasks?.icon} {row.tasks?.title ?? "?"}
                    </div>
                    <div className="text-xs text-purple-500 font-medium">
                      {row.profiles?.name} · {formatKr(row.reward_ore)} ·{" "}
                      {row.tasks ? xpForTask(row.tasks) : 10} XP
                    </div>
                  </div>
                  <button
                    disabled={busy === row.id}
                    onClick={() => reviewTask(row, false)}
                    className="w-10 h-10 rounded-full bg-red-100 text-red-600 text-xl font-bold active:scale-95"
                    aria-label="Avvis"
                  >
                    ✕
                  </button>
                  <button
                    disabled={busy === row.id}
                    onClick={() => reviewTask(row, true)}
                    className="w-10 h-10 rounded-full bg-green-500 text-white text-xl font-bold shadow-md active:scale-95"
                    aria-label="Godkjenn"
                  >
                    ✓
                  </button>
                </motion.div>
              ))}
              {pendingBonus.map((row) => (
                <motion.div
                  key={row.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="card p-3 flex items-center gap-3 bg-gradient-to-r from-amber-50 to-white"
                >
                  {row.profiles && (
                    <ProfileAvatar
                      emoji={row.profiles.avatar_emoji}
                      color={row.profiles.avatar_color}
                      size="sm"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-purple-900 truncate">
                      🏆 {row.bonuses?.title}
                    </div>
                    <div className="text-xs text-purple-500 font-medium">
                      {row.profiles?.name} · Premie {formatKr(row.reward_ore)}
                    </div>
                  </div>
                  <button
                    disabled={busy === row.id}
                    onClick={() => reviewBonus(row, false)}
                    className="w-10 h-10 rounded-full bg-red-100 text-red-600 text-xl font-bold"
                  >
                    ✕
                  </button>
                  <button
                    disabled={busy === row.id}
                    onClick={() => reviewBonus(row, true)}
                    className="w-10 h-10 rounded-full bg-green-500 text-white text-xl font-bold shadow-md"
                  >
                    ✓
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
