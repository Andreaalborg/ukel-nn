"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured, getCurrentHouseholdId } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import { getActiveProfile } from "@/lib/auth";
import type { Profile, Task, TaskCompletion } from "@/lib/types";
import { formatKr, startOfWeek, todayIso } from "@/lib/utils";
import { getTaskState } from "@/lib/scheduling";
import ProfileAvatar from "@/components/ProfileAvatar";
import SetupNotice from "@/components/SetupNotice";
import { celebrate } from "@/components/Celebrate";
import { motion } from "framer-motion";

const START_HOUR = 6;
const END_HOUR = 21;
const PX_PER_HOUR = 56;
const TIMELINE_HEIGHT = (END_HOUR - START_HOUR) * PX_PER_HOUR;
const ANYTIME_MIN_HEIGHT = 72;
const COLUMN_WIDTH = 208;
const GUTTER_WIDTH = 52;
const BUCKET_MIN = 30; // grupperer oppgaver i 30-min-bøtter for å unngå kollisjon

type TaskWithState = Task & {
  state: "available" | "pending" | "approved" | "rejected" | "locked";
  completion?: TaskCompletion;
};

export default function DagsplanPage() {
  const router = useRouter();
  const { session, loading: sessionLoading, error: sessionError } = useSession();
  const [kids, setKids] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  const today = todayIso();
  const weekStart = useMemo(() => startOfWeek().toISOString().slice(0, 10), []);

  const load = useCallback(async () => {
    const hid = await getCurrentHouseholdId();
    if (!hid) {
      const { data: orphans } = await supabase.rpc("list_orphan_households");
      if (orphans && (orphans as unknown[]).length > 0) router.replace("/claim");
      else router.replace("/onboarding");
      return;
    }
    const [kRes, tRes, cRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "child").order("sort_order"),
      supabase.from("tasks").select("*").eq("active", true).order("sort_order"),
      supabase.from("task_completions").select("*"),
    ]);
    setKids((kRes.data as Profile[]) ?? []);
    setTasks((tRes.data as Task[]) ?? []);
    setCompletions((cRes.data as TaskCompletion[]) ?? []);
    setLoading(false);
  }, [router]);

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
    load();
  }, [session, sessionLoading, router, load]);

  // Oppdater "nå"-streken hvert minutt
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const tasksForKid = useCallback(
    (kid: Profile): TaskWithState[] => {
      const mine = completions.filter((c) => c.child_id === kid.id);
      return tasks
        .filter((t) => !t.assigned_to || t.assigned_to === kid.id)
        .map((task) => {
          const { state, completion } = getTaskState(task, mine, today, weekStart);
          return { ...task, state, completion };
        })
        .filter((t) => t.state !== "locked" && t.state !== "rejected");
    },
    [tasks, completions, today, weekStart]
  );

  const claimTask = async (task: TaskWithState, kid: Profile) => {
    const hid = await getCurrentHouseholdId();
    if (!hid) return;
    setBusy(`${task.id}-${kid.id}`);
    const { data, error } = await supabase
      .from("task_completions")
      .insert({
        household_id: hid,
        task_id: task.id,
        child_id: kid.id,
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

  const unclaimTask = async (completionId: string) => {
    setBusy(completionId);
    await supabase.from("task_completions").delete().eq("id", completionId);
    setCompletions((c) => c.filter((x) => x.id !== completionId));
    setBusy(null);
  };

  const timeToY = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    const hours = Math.min(END_HOUR, Math.max(START_HOUR, h + m / 60));
    return (hours - START_HOUR) * PX_PER_HOUR;
  };

  const nowY =
    now.getHours() >= START_HOUR && now.getHours() < END_HOUR
      ? (now.getHours() + now.getMinutes() / 60 - START_HOUR) * PX_PER_HOUR
      : null;

  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i
  );

  const backHref = (() => {
    const active = getActiveProfile();
    if (active?.role === "parent") return "/forelder";
    if (active?.role === "child" && active.id) return `/barn?p=${active.id}`;
    return "/";
  })();

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
      <div className="min-h-screen flex items-center justify-center text-6xl animate-float">
        📅
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-purple-100 px-4 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <Link
            href={backHref}
            className="text-purple-600 font-semibold text-sm hover:text-purple-800"
          >
            ← Tilbake
          </Link>
          <div className="text-center">
            <div className="font-extrabold text-purple-900 text-lg leading-tight">
              📅 Familiekalender
            </div>
            <div className="text-xs text-purple-500 font-medium">
              {now.toLocaleDateString("nb-NO", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {kids.length === 0 ? (
        <div className="p-8 text-center text-purple-500">
          Ingen barn registrert enda.
        </div>
      ) : (
        <div className="px-2 pt-3 max-w-5xl mx-auto">
          <p className="text-center text-xs text-purple-400 mb-2">
            Trykk på en oppgave for å krysse den av — en voksen godkjenner etterpå
          </p>
          <div className="overflow-x-auto no-scrollbar">
            <div className="inline-flex" style={{ minWidth: "100%" }}>
              {/* Gutter med klokkeslett */}
              <div
                className="sticky left-0 z-20 bg-white/95 backdrop-blur flex-shrink-0"
                style={{ width: GUTTER_WIDTH }}
              >
                <div style={{ height: ANYTIME_MIN_HEIGHT }} className="flex items-end pb-1">
                  <span className="text-[9px] font-bold text-purple-400 uppercase">
                    Når som
                    <br />
                    helst
                  </span>
                </div>
                <div className="relative" style={{ height: TIMELINE_HEIGHT }}>
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute -translate-y-1/2 text-[10px] font-bold text-purple-400 pr-1 text-right w-full"
                      style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
                    >
                      {String(h).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Kolonner per barn */}
              <div className="flex gap-3 pl-2 pr-3">
                {kids.map((kid) => {
                  const kidTasks = tasksForKid(kid);
                  const anytimeTasks = kidTasks.filter((t) => !t.due_time);
                  const timedTasks = kidTasks.filter((t) => t.due_time);

                  // Grupper timede oppgaver i 30-min-bøtter for å unngå kollisjon
                  const buckets = new Map<number, TaskWithState[]>();
                  for (const t of timedTasks) {
                    const [h, m] = t.due_time!.split(":").map(Number);
                    const totalMin = h * 60 + m;
                    const bucketKey =
                      Math.round(totalMin / BUCKET_MIN) * BUCKET_MIN;
                    if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
                    buckets.get(bucketKey)!.push(t);
                  }

                  return (
                    <div
                      key={kid.id}
                      className="flex-shrink-0"
                      style={{ width: COLUMN_WIDTH }}
                    >
                      {/* Kid header */}
                      <div className="flex items-center gap-2 mb-2">
                        <ProfileAvatar
                          emoji={kid.avatar_emoji}
                          color={kid.avatar_color}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="font-extrabold text-purple-900 text-sm truncate">
                            {kid.name}
                          </div>
                          <div className="text-[10px] text-purple-500 font-medium">
                            {formatKr(kid.balance_ore)}
                          </div>
                        </div>
                      </div>

                      {/* Når som helst */}
                      <div
                        className="flex flex-wrap gap-1 content-start"
                        style={{ minHeight: ANYTIME_MIN_HEIGHT }}
                      >
                        {anytimeTasks.length === 0 ? (
                          <div className="text-[10px] text-purple-300 italic px-1">
                            Ingen
                          </div>
                        ) : (
                          anytimeTasks.map((t) => (
                            <TaskChip
                              key={t.id}
                              task={t}
                              busy={busy === `${t.id}-${kid.id}` || busy === t.completion?.id}
                              onTap={() => {
                                if (t.state === "available") claimTask(t, kid);
                                else if (t.state === "pending" && t.completion)
                                  unclaimTask(t.completion.id);
                              }}
                            />
                          ))
                        )}
                      </div>

                      {/* Tidslinje */}
                      <div
                        className="relative border-t border-purple-100 mt-1"
                        style={{ height: TIMELINE_HEIGHT }}
                      >
                        {hours.map((h) => (
                          <div
                            key={h}
                            className="absolute left-0 right-0 border-t border-purple-50"
                            style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
                          />
                        ))}
                        {nowY !== null && (
                          <div
                            className="absolute left-0 right-0 h-0.5 bg-red-400 z-10"
                            style={{ top: nowY }}
                          >
                            <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-400" />
                          </div>
                        )}
                        {[...buckets.entries()].map(([bucketMin, bucketTasks]) => (
                          <div
                            key={bucketMin}
                            className="absolute left-0.5 right-0.5 space-y-0.5"
                            style={{
                              top:
                                ((bucketMin / 60) - START_HOUR) * PX_PER_HOUR,
                            }}
                          >
                            {bucketTasks.map((t) => (
                              <TaskChip
                                key={t.id}
                                task={t}
                                compact
                                busy={
                                  busy === `${t.id}-${kid.id}` ||
                                  busy === t.completion?.id
                                }
                                onTap={() => {
                                  if (t.state === "available") claimTask(t, kid);
                                  else if (t.state === "pending" && t.completion)
                                    unclaimTask(t.completion.id);
                                }}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskChip({
  task,
  onTap,
  busy,
  compact,
}: {
  task: TaskWithState;
  onTap: () => void;
  busy: boolean;
  compact?: boolean;
}) {
  const clickable = task.state === "available" || task.state === "pending";
  const stateStyles: Record<string, string> = {
    available: "bg-white shadow-sm active:scale-95",
    pending: "bg-amber-50 border border-amber-200 opacity-90",
    approved: "bg-green-50 border border-green-200",
  };

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      disabled={busy || !clickable}
      onClick={onTap}
      className={`w-full flex items-center gap-1 rounded-lg px-1.5 text-left ${
        compact ? "py-1" : "py-1.5"
      } ${stateStyles[task.state] ?? "bg-white"} ${
        !clickable ? "cursor-default" : ""
      }`}
      style={{ borderLeft: `3px solid ${task.color}` }}
      title={task.title}
    >
      <span className="text-sm flex-shrink-0">{task.icon}</span>
      <span className="text-[10px] font-bold text-purple-900 truncate flex-1">
        {task.title}
      </span>
      {task.state === "pending" && <span className="text-[9px]">⏳</span>}
      {task.state === "approved" && <span className="text-[9px]">✅</span>}
    </motion.button>
  );
}
