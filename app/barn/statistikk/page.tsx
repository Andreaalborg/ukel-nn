"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getActiveProfile } from "@/lib/auth";
import { useSession } from "@/lib/useSession";
import type { PeriodAchievement, Profile, Task, TaskCompletion } from "@/lib/types";
import { formatKr, startOfWeek, todayIso } from "@/lib/utils";
import { xpForTask } from "@/lib/levels";
import ProfileAvatar from "@/components/ProfileAvatar";
import SetupNotice from "@/components/SetupNotice";

export default function StatsWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-6xl animate-float">📊</div>}>
      <ChildStatsPage />
    </Suspense>
  );
}

function ChildStatsPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { session, loading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [achievements, setAchievements] = useState<PeriodAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  const profileId = useMemo(() => {
    const q = search.get("p");
    if (q) return q;
    return getActiveProfile()?.id ?? null;
  }, [search]);

  const reload = useCallback(async () => {
    if (!profileId) return;
    const [pRes, tRes, cRes, aRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).single(),
      supabase.from("tasks").select("*"),
      supabase
        .from("task_completions")
        .select("*")
        .eq("child_id", profileId)
        .eq("status", "approved"),
      supabase
        .from("period_achievements")
        .select("*")
        .eq("child_id", profileId)
        .order("period_end", { ascending: false }),
    ]);
    if (pRes.data) setProfile(pRes.data as Profile);
    setTasks((tRes.data as Task[]) ?? []);
    setCompletions((cRes.data as TaskCompletion[]) ?? []);
    setAchievements((aRes.data as PeriodAchievement[]) ?? []);
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
    reload();
  }, [profileId, reload, router, session, sessionLoading]);

  const today = todayIso();

  const data = useMemo(() => {
    const taskCounts: Record<string, number> = {};
    for (const c of completions) taskCounts[c.task_id] = (taskCounts[c.task_id] ?? 0) + 1;
    const topTasks = Object.entries(taskCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([taskId, count]) => ({ task: tasks.find((t) => t.id === taskId), count }))
      .filter((x) => x.task);

    const weeklyBuckets: { weekStart: string; count: number; ore: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const ws = startOfWeek(d).toISOString().slice(0, 10);
      const we = new Date(ws);
      we.setDate(we.getDate() + 7);
      const wEnd = we.toISOString().slice(0, 10);
      const matches = completions.filter((c) => c.completion_date >= ws && c.completion_date < wEnd);
      weeklyBuckets.push({
        weekStart: ws,
        count: matches.length,
        ore: matches.reduce((s, c) => s + c.reward_ore, 0),
      });
    }
    const maxWeekOre = Math.max(...weeklyBuckets.map((b) => b.ore), 1);

    return {
      total: completions.length,
      totalOre: completions.reduce((s, c) => s + c.reward_ore, 0),
      totalXp: completions.reduce(
        (s, c) => s + xpForTask(tasks.find((t) => t.id === c.task_id) ?? { xp_value: 10 }),
        0
      ),
      todayCount: completions.filter((c) => c.completion_date === today).length,
      topTasks,
      weeklyBuckets,
      maxWeekOre,
    };
  }, [completions, tasks, today]);

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-6xl animate-float">📊</div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div
        className="px-5 pt-6 pb-8 rounded-b-[2.5rem] text-white"
        style={{
          background: `linear-gradient(135deg, ${profile.avatar_color}, #8b5cf6 100%)`,
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Link
            href={`/barn?p=${profile.id}`}
            className="text-white/80 text-sm font-semibold bg-white/20 backdrop-blur px-3 py-1.5 rounded-full"
          >
            ← Tilbake
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <ProfileAvatar emoji={profile.avatar_emoji} color={profile.avatar_color} size="md" className="ring-4 ring-white/40" />
          <div>
            <div className="text-xs opacity-80 font-medium">Min statistikk</div>
            <div className="text-2xl font-extrabold">{profile.name}</div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <BigStat icon="✅" label="Oppgaver" value={`${data.total}`} />
          <BigStat icon="💰" label="Totalt" value={formatKr(data.totalOre)} />
          <BigStat icon="⚡" label="XP totalt" value={`${data.totalXp}`} />
        </div>

        {/* Graf */}
        <div className="card p-4">
          <div className="text-xs font-bold text-purple-500 uppercase mb-2">Siste 8 uker</div>
          <div className="flex items-end gap-1 h-32">
            {data.weeklyBuckets.map((b, i) => {
              const h = (b.ore / data.maxWeekOre) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[9px] font-bold text-purple-600">
                    {b.ore > 0 ? formatKr(b.ore).replace(" kr", "") : ""}
                  </div>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${h}%`,
                      minHeight: b.ore > 0 ? "4px" : "0",
                      background: `linear-gradient(180deg, ${profile.avatar_color}, #8B5CF6)`,
                    }}
                  />
                  <div className="text-[9px] text-purple-400 font-semibold">
                    {b.weekStart.slice(5).replace("-", "/")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topp oppgaver */}
        {data.topTasks.length > 0 && (
          <div className="card p-4">
            <div className="text-xs font-bold text-purple-500 uppercase mb-2">
              🏆 Dine favoritter
            </div>
            <div className="space-y-2">
              {data.topTasks.map(({ task, count }) => (
                <div key={task!.id} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${task!.color}33` }}
                  >
                    {task!.icon}
                  </div>
                  <div className="flex-1 font-bold text-purple-900 truncate">{task!.title}</div>
                  <div className="font-extrabold text-purple-700">{count}×</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Periode-historikk */}
        {achievements.length > 0 && (
          <div className="card p-4">
            <div className="text-xs font-bold text-purple-500 uppercase mb-2">📅 Dine perioder</div>
            <div className="space-y-2">
              {achievements.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <div
                    className={`text-2xl ${a.reached_max ? "" : "grayscale opacity-60"}`}
                  >
                    {a.reached_max ? "👑" : "⭐"}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-purple-900 text-sm">
                      {a.period_start} → {a.period_end}
                    </div>
                    <div className="text-xs text-purple-500">
                      {a.tasks_completed} oppgaver · Level {a.max_level}
                    </div>
                  </div>
                  <div className="font-extrabold text-purple-700">{formatKr(a.ore_earned)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BigStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-xs text-purple-500 font-bold uppercase">{label}</div>
      <div className="font-extrabold text-purple-900">{value}</div>
    </div>
  );
}
