"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { clearActiveProfile, getActiveProfile } from "@/lib/auth";
import type { Bonus, BonusClaim, Profile, Task, TaskCompletion } from "@/lib/types";
import { formatKr, startOfMonth, startOfWeek, todayIso } from "@/lib/utils";
import ProfileAvatar from "@/components/ProfileAvatar";
import XpBar from "@/components/XpBar";
import { celebrate } from "@/components/Celebrate";
import SetupNotice from "@/components/SetupNotice";
import { motion, AnimatePresence } from "framer-motion";

type TaskState = "available" | "pending" | "approved" | "rejected";

type TaskWithState = Task & {
  state: TaskState;
  completion?: TaskCompletion;
};

export default function ChildPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-6xl animate-float">🌟</div>}>
      <ChildPage />
    </Suspense>
  );
}

function ChildPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [bonusClaims, setBonusClaims] = useState<BonusClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const profileId = useMemo(() => {
    const fromQuery = search.get("p");
    if (fromQuery) return fromQuery;
    const active = getActiveProfile();
    return active?.id ?? null;
  }, [search]);

  const loadAll = useCallback(async () => {
    if (!profileId) return;
    const [pRes, tRes, cRes, bRes, bcRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).single(),
      supabase.from("tasks").select("*").eq("active", true).order("sort_order"),
      supabase
        .from("task_completions")
        .select("*")
        .eq("child_id", profileId)
        .order("completed_at", { ascending: false }),
      supabase.from("bonuses").select("*").eq("active", true),
      supabase.from("bonus_claims").select("*").eq("child_id", profileId),
    ]);
    if (pRes.data) setProfile(pRes.data as Profile);
    setTasks((tRes.data as Task[]) ?? []);
    setCompletions((cRes.data as TaskCompletion[]) ?? []);
    setBonuses((bRes.data as Bonus[]) ?? []);
    setBonusClaims((bcRes.data as BonusClaim[]) ?? []);
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    if (!profileId) {
      router.replace("/");
      return;
    }
    loadAll();
  }, [profileId, loadAll, router]);

  const today = todayIso();
  const weekStart = startOfWeek().toISOString().slice(0, 10);
  const monthStart = startOfMonth().toISOString().slice(0, 10);

  const taskList: TaskWithState[] = useMemo(() => {
    return tasks
      .filter((t) => !t.assigned_to || t.assigned_to === profileId)
      .map((task) => {
        const relevant = completions.filter((c) => c.task_id === task.id);
        let active: TaskCompletion | undefined;
        if (task.recurrence === "daily") {
          active = relevant.find((c) => c.completion_date === today);
        } else if (task.recurrence === "weekly") {
          active = relevant.find((c) => c.completion_date >= weekStart);
        } else {
          active = relevant.find((c) => c.status !== "rejected");
        }
        const state: TaskState = active
          ? (active.status as TaskState)
          : "available";
        return { ...task, state, completion: active };
      });
  }, [tasks, completions, profileId, today, weekStart]);

  const groupedTasks = useMemo(() => {
    return {
      available: taskList.filter((t) => t.state === "available"),
      pending: taskList.filter((t) => t.state === "pending"),
      approved: taskList.filter((t) => t.state === "approved"),
    };
  }, [taskList]);

  const todayEarned = useMemo(() => {
    return completions
      .filter((c) => c.status === "approved" && c.completion_date === today)
      .reduce((sum, c) => sum + c.reward_ore, 0);
  }, [completions, today]);

  const weekEarned = useMemo(() => {
    return completions
      .filter((c) => c.status === "approved" && c.completion_date >= weekStart)
      .reduce((sum, c) => sum + c.reward_ore, 0);
  }, [completions, weekStart]);

  const claimTask = async (task: TaskWithState) => {
    if (!profile || task.state !== "available") return;
    setBusy(task.id);
    const { data, error } = await supabase
      .from("task_completions")
      .insert({
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
        bonus.period === "week" ? weekStart : bonus.period === "month" ? monthStart : bonus.start_date;
      const ends = bonus.end_date;
      const inRange = (date: string) => date >= periodStart && (!ends || date <= ends);

      let progress = 0;
      let goal = bonus.goal_value ?? 1;
      if (bonus.goal_type === "tasks_count") {
        progress = completions.filter((c) => c.status === "approved" && inRange(c.completion_date)).length;
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
    [completions, bonusClaims, profileId, weekStart, monthStart]
  );

  if (!isSupabaseConfigured) return <SetupNotice />;
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
          <div className="text-right">
            <div className="text-xs opacity-80 font-medium">Saldo</div>
            <div className="text-3xl font-extrabold">{formatKr(profile.balance_ore)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <ProfileAvatar emoji={profile.avatar_emoji} color={profile.avatar_color} size="md" className="ring-4 ring-white/40" />
          <div>
            <div className="text-xs opacity-80 font-medium">Hei!</div>
            <div className="text-2xl font-extrabold">{profile.name}</div>
          </div>
        </div>
        <div className="bg-white/20 backdrop-blur rounded-2xl p-3">
          <XpBar xp={profile.xp} color={profile.avatar_color} />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-center">
          <div className="bg-white/20 backdrop-blur rounded-2xl py-2">
            <div className="text-xs opacity-80">I dag</div>
            <div className="font-extrabold">{formatKr(todayEarned)}</div>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-2xl py-2">
            <div className="text-xs opacity-80">Denne uka</div>
            <div className="font-extrabold">{formatKr(weekEarned)}</div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
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
            🎯 Oppgaver i dag <span className="text-purple-400 text-sm font-medium">({groupedTasks.available.length})</span>
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
                      <div className="font-extrabold text-purple-900 truncate">{t.title}</div>
                      {t.description && (
                        <div className="text-xs text-purple-500 truncate">{t.description}</div>
                      )}
                      <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400 mt-0.5">
                        {t.recurrence === "daily" ? "Hver dag" : t.recurrence === "weekly" ? "Hver uke" : "Engangs"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-600 font-extrabold text-lg">{formatKr(t.reward_ore)}</div>
                      <div className="text-xs text-purple-400 font-semibold">Trykk!</div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Venter på godkjenning */}
        {groupedTasks.pending.length > 0 && (
          <section>
            <h3 className="font-extrabold text-purple-900 text-lg mb-2 flex items-center gap-2">
              ⏳ Venter på godkjenning <span className="text-purple-400 text-sm font-medium">({groupedTasks.pending.length})</span>
            </h3>
            <div className="grid gap-2">
              {groupedTasks.pending.map((t) => (
                <div key={t.id} className="card p-3 flex items-center gap-3 opacity-90">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${t.color}33` }}>
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-purple-900 truncate">{t.title}</div>
                    <div className="text-xs text-amber-600 font-semibold">Venter på voksen...</div>
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
            </div>
          </section>
        )}

        {/* Ferdig */}
        {groupedTasks.approved.length > 0 && (
          <section>
            <h3 className="font-extrabold text-purple-900 text-lg mb-2 flex items-center gap-2">
              ✅ Ferdig <span className="text-purple-400 text-sm font-medium">({groupedTasks.approved.length})</span>
            </h3>
            <div className="grid gap-2">
              {groupedTasks.approved.map((t) => (
                <div key={t.id} className="card p-3 flex items-center gap-3 bg-gradient-to-r from-green-50 to-white">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-green-100">
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-purple-900 truncate line-through opacity-70">{t.title}</div>
                    <div className="text-xs text-green-600 font-semibold">✓ Godkjent</div>
                  </div>
                  <div className="text-green-600 font-extrabold">+{formatKr(t.reward_ore)}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
