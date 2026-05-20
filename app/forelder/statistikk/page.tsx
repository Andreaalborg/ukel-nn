"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { PeriodAchievement, Profile, Task, TaskCompletion } from "@/lib/types";
import { formatKr, startOfMonth, startOfWeek, todayIso } from "@/lib/utils";
import { xpForTask } from "@/lib/levels";
import ProfileAvatar from "@/components/ProfileAvatar";
import SetupNotice from "@/components/SetupNotice";

export default function StatsPage() {
  const [kids, setKids] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [achievements, setAchievements] = useState<PeriodAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [kRes, tRes, cRes, aRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "child").order("sort_order"),
      supabase.from("tasks").select("*"),
      supabase.from("task_completions").select("*").eq("status", "approved"),
      supabase.from("period_achievements").select("*").order("period_end", { ascending: false }),
    ]);
    setKids((kRes.data as Profile[]) ?? []);
    setTasks((tRes.data as Task[]) ?? []);
    setCompletions((cRes.data as TaskCompletion[]) ?? []);
    setAchievements((aRes.data as PeriodAchievement[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    reload();
  }, [reload]);

  const today = todayIso();
  const weekStart = useMemo(() => startOfWeek().toISOString().slice(0, 10), []);
  const monthStart = useMemo(() => startOfMonth().toISOString().slice(0, 10), []);

  const stats = (kidId: string) => {
    const all = completions.filter((c) => c.child_id === kidId);
    const week = all.filter((c) => c.completion_date >= weekStart);
    const month = all.filter((c) => c.completion_date >= monthStart);
    const todayList = all.filter((c) => c.completion_date === today);

    const taskCounts: Record<string, number> = {};
    for (const c of all) {
      taskCounts[c.task_id] = (taskCounts[c.task_id] ?? 0) + 1;
    }
    const topTasks = Object.entries(taskCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([taskId, count]) => ({
        task: tasks.find((t) => t.id === taskId),
        count,
      }))
      .filter((x) => x.task);

    // Siste 8 uker
    const weeklyBuckets: { weekStart: string; count: number; ore: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const ws = startOfWeek(d).toISOString().slice(0, 10);
      const we = new Date(ws);
      we.setDate(we.getDate() + 7);
      const wEnd = we.toISOString().slice(0, 10);
      const matches = all.filter((c) => c.completion_date >= ws && c.completion_date < wEnd);
      weeklyBuckets.push({
        weekStart: ws,
        count: matches.length,
        ore: matches.reduce((s, c) => s + c.reward_ore, 0),
      });
    }
    const maxWeekOre = Math.max(...weeklyBuckets.map((b) => b.ore), 1);

    return {
      total: all.length,
      totalOre: all.reduce((s, c) => s + c.reward_ore, 0),
      totalXp: all.reduce((s, c) => s + xpForTask(tasks.find((t) => t.id === c.task_id) ?? { xp_value: 10 }), 0),
      todayCount: todayList.length,
      weekCount: week.length,
      weekOre: week.reduce((s, c) => s + c.reward_ore, 0),
      monthCount: month.length,
      monthOre: month.reduce((s, c) => s + c.reward_ore, 0),
      topTasks,
      weeklyBuckets,
      maxWeekOre,
    };
  };

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (loading) return <div className="text-center py-12 text-4xl animate-float">📊</div>;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold text-purple-900">Statistikk</h1>
        <p className="text-purple-600 font-medium text-sm">Følg progresjonen over tid</p>
      </header>

      {kids.map((kid) => {
        const s = stats(kid.id);
        const myAchievements = achievements.filter((a) => a.child_id === kid.id);
        return (
          <section key={kid.id} className="space-y-3">
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <ProfileAvatar emoji={kid.avatar_emoji} color={kid.avatar_color} size="md" />
                <div className="flex-1">
                  <div className="font-extrabold text-purple-900 text-xl">{kid.name}</div>
                  <div className="text-xs text-purple-500 font-medium">Totalt opptjent</div>
                  <div className="text-2xl font-extrabold text-purple-900">{formatKr(s.totalOre)}</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Stat label="I dag" value={`${s.todayCount}`} />
                <Stat label="Uka" value={`${s.weekCount}`} />
                <Stat label="Mnd" value={`${s.monthCount}`} />
                <Stat label="Total" value={`${s.total}`} />
              </div>
            </div>

            {/* 8-ukers graf */}
            <div className="card p-4">
              <div className="text-xs font-bold text-purple-500 uppercase mb-2">Siste 8 uker</div>
              <div className="flex items-end gap-1 h-32">
                {s.weeklyBuckets.map((b, i) => {
                  const h = (b.ore / s.maxWeekOre) * 100;
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
                          background: `linear-gradient(180deg, ${kid.avatar_color}, #8B5CF6)`,
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

            {/* Top oppgaver */}
            {s.topTasks.length > 0 && (
              <div className="card p-4">
                <div className="text-xs font-bold text-purple-500 uppercase mb-2">
                  Mest gjorte oppgaver
                </div>
                <div className="space-y-1.5">
                  {s.topTasks.map(({ task, count }) => (
                    <div key={task!.id} className="flex items-center gap-2">
                      <div className="text-xl">{task!.icon}</div>
                      <div className="flex-1 text-sm font-bold text-purple-900 truncate">
                        {task!.title}
                      </div>
                      <div className="text-sm font-extrabold text-purple-700">{count}×</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Periode-historikk */}
            {myAchievements.length > 0 && (
              <div className="card p-4">
                <div className="text-xs font-bold text-purple-500 uppercase mb-2">
                  Avsluttede perioder
                </div>
                <div className="space-y-1.5">
                  {myAchievements.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center gap-2 text-sm">
                      <div
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          a.reached_max
                            ? "bg-amber-200 text-amber-900"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {a.reached_max ? "👑" : `L${a.max_level}`}
                      </div>
                      <div className="flex-1 text-purple-700 font-semibold">
                        {a.period_start} → {a.period_end}
                      </div>
                      <div className="text-purple-500 text-xs">
                        {a.tasks_completed} oppg · {formatKr(a.ore_earned)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}

      {kids.length === 0 && (
        <div className="card p-6 text-center text-purple-500">
          Ingen barn registrert enda.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-purple-50 rounded-xl py-2 text-center">
      <div className="text-[10px] text-purple-500 font-bold uppercase">{label}</div>
      <div className="font-extrabold text-purple-900">{value}</div>
    </div>
  );
}
