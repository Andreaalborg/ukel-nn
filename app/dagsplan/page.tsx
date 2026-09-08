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
const PX_PER_HOUR = 90;
const TIMELINE_WIDTH = (END_HOUR - START_HOUR) * PX_PER_HOUR;
const GUTTER_WIDTH = 136;
const ANYTIME_WIDTH = 104;
const ROW_MIN_HEIGHT = 68;
const HEADER_HEIGHT = 40;
const CHIP_HEIGHT = 32;
const CHIP_WIDTH = 98;
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

  const nowX =
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
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-purple-100 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
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
        <div className="max-w-6xl mx-auto pt-3">
          <p className="text-center text-xs text-purple-400 mb-2 px-4">
            Trykk på en oppgave for å krysse den av — en voksen godkjenner etterpå
          </p>

          <div className="overflow-x-auto no-scrollbar border border-purple-100 rounded-2xl mx-2 sm:mx-4 bg-white">
            <div style={{ minWidth: GUTTER_WIDTH + ANYTIME_WIDTH + TIMELINE_WIDTH }}>
              {/* Header-rad: klokkeslett */}
              <div
                className="flex bg-white border-b-2 border-purple-200"
                style={{ height: HEADER_HEIGHT }}
              >
                <div
                  className="sticky left-0 z-30 bg-white flex items-center justify-center border-r border-purple-100 flex-shrink-0"
                  style={{ width: GUTTER_WIDTH }}
                >
                  <span className="text-[10px] font-extrabold text-purple-400 uppercase">
                    Familie
                  </span>
                </div>
                <div
                  className="sticky z-30 bg-white flex items-center justify-center border-r-2 border-purple-200 flex-shrink-0"
                  style={{ width: ANYTIME_WIDTH, left: GUTTER_WIDTH }}
                >
                  <span className="text-[10px] font-extrabold text-purple-400 uppercase text-center leading-tight">
                    Når som
                    <br />
                    helst
                  </span>
                </div>
                <div className="relative flex-shrink-0" style={{ width: TIMELINE_WIDTH }}>
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute top-0 bottom-0 flex items-center border-l border-purple-100"
                      style={{ left: (h - START_HOUR) * PX_PER_HOUR }}
                    >
                      <span className="text-[10px] font-bold text-purple-500 pl-1">
                        {String(h).padStart(2, "0")}:00
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rader per familiemedlem */}
              {kids.map((kid, kidIdx) => {
                const kidTasks = tasksForKid(kid);
                const anytimeTasks = kidTasks.filter((t) => !t.due_time);
                const timedTasks = kidTasks.filter((t) => t.due_time);

                // Grupper timede oppgaver i 30-min-bøtter, stables vertikalt ved kollisjon
                const buckets = new Map<number, TaskWithState[]>();
                for (const t of timedTasks) {
                  const [h, m] = t.due_time!.split(":").map(Number);
                  const totalMin = h * 60 + m;
                  const bucketKey = Math.round(totalMin / BUCKET_MIN) * BUCKET_MIN;
                  if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
                  buckets.get(bucketKey)!.push(t);
                }
                const maxStack = Math.max(1, ...[...buckets.values()].map((b) => b.length));
                const rowHeight = Math.max(
                  ROW_MIN_HEIGHT,
                  maxStack * (CHIP_HEIGHT + 4) + 12
                );

                return (
                  <div
                    key={kid.id}
                    className={`flex ${kidIdx > 0 ? "border-t border-purple-100" : ""}`}
                    style={{ minHeight: rowHeight }}
                  >
                    {/* Gutter: avatar + navn */}
                    <div
                      className="sticky left-0 z-20 bg-white flex items-center gap-2 px-2 border-r border-purple-100 flex-shrink-0"
                      style={{ width: GUTTER_WIDTH }}
                    >
                      <ProfileAvatar emoji={kid.avatar_emoji} color={kid.avatar_color} size="sm" />
                      <div className="min-w-0">
                        <div className="font-extrabold text-purple-900 text-xs truncate">
                          {kid.name}
                        </div>
                        <div className="text-[10px] text-purple-500 font-medium">
                          {formatKr(kid.balance_ore)}
                        </div>
                      </div>
                    </div>

                    {/* Når som helst-celle */}
                    <div
                      className="sticky z-20 bg-white flex flex-col gap-1 justify-center items-center p-1.5 border-r-2 border-purple-200 flex-shrink-0"
                      style={{ width: ANYTIME_WIDTH, left: GUTTER_WIDTH }}
                    >
                      {anytimeTasks.length === 0 ? (
                        <span className="text-[9px] text-purple-300 italic">—</span>
                      ) : (
                        anytimeTasks.map((t) => (
                          <TaskChip
                            key={t.id}
                            task={t}
                            fullWidth
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

                    {/* Tidsrutenett */}
                    <div
                      className="relative flex-shrink-0"
                      style={{ width: TIMELINE_WIDTH, minHeight: rowHeight }}
                    >
                      {/* Rutenett-linjer: hel time (solid) + halvtime (lys) */}
                      {hours.map((h) => (
                        <div
                          key={`h-${h}`}
                          className="absolute top-0 bottom-0 border-l border-purple-100"
                          style={{ left: (h - START_HOUR) * PX_PER_HOUR }}
                        />
                      ))}
                      {hours.slice(0, -1).map((h) => (
                        <div
                          key={`hm-${h}`}
                          className="absolute top-0 bottom-0 border-l border-dashed border-purple-50"
                          style={{ left: (h - START_HOUR) * PX_PER_HOUR + PX_PER_HOUR / 2 }}
                        />
                      ))}

                      {/* Nå-strek */}
                      {nowX !== null && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                          style={{ left: nowX }}
                        >
                          <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-red-400" />
                        </div>
                      )}

                      {/* Oppgave-blokker */}
                      {[...buckets.entries()].map(([bucketMin, bucketTasks]) => (
                        <div
                          key={bucketMin}
                          className="absolute flex flex-col gap-1 top-1.5"
                          style={{
                            left: (bucketMin / 60 - START_HOUR) * PX_PER_HOUR + 3,
                            width: CHIP_WIDTH,
                          }}
                        >
                          {bucketTasks.map((t) => (
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
      )}
    </div>
  );
}

function TaskChip({
  task,
  onTap,
  busy,
  fullWidth,
}: {
  task: TaskWithState;
  onTap: () => void;
  busy: boolean;
  fullWidth?: boolean;
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
      className={`flex flex-col items-start justify-center rounded-lg px-1.5 py-1 text-left overflow-hidden ${
        fullWidth ? "w-full" : ""
      } ${stateStyles[task.state] ?? "bg-white"} ${!clickable ? "cursor-default" : ""}`}
      style={{
        borderLeft: `3px solid ${task.color}`,
        height: CHIP_HEIGHT,
        width: fullWidth ? undefined : CHIP_WIDTH,
      }}
      title={`${task.title}${task.due_time ? " · " + task.due_time.slice(0, 5) : ""}`}
    >
      <div className="flex items-center gap-1 w-full">
        <span className="text-xs flex-shrink-0">{task.icon}</span>
        <span className="text-[9px] font-bold text-purple-900 truncate flex-1">
          {task.title}
        </span>
        {task.state === "pending" && <span className="text-[8px] flex-shrink-0">⏳</span>}
        {task.state === "approved" && <span className="text-[8px] flex-shrink-0">✅</span>}
      </div>
    </motion.button>
  );
}
