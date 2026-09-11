"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured, getCurrentHouseholdId } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import {getActiveProfile, PROFILE_SAFE_COLUMNS} from "@/lib/auth";
import type { Profile, Task, TaskCompletion } from "@/lib/types";
import { addDaysIso, dateToIso, formatKr, startOfWeek, todayIso } from "@/lib/utils";
import { getTaskState } from "@/lib/scheduling";
import ProfileAvatar from "@/components/ProfileAvatar";
import SetupNotice from "@/components/SetupNotice";
import { celebrate } from "@/components/Celebrate";
import { AnimatePresence, motion } from "framer-motion";

const START_HOUR = 6;
const END_HOUR = 21;
const GUTTER_WIDTH = 160;
const ANYTIME_WIDTH = 128;
const HEADER_HEIGHT = 44;
const LANE_HEIGHT = 66;
const LANE_GAP = 10;
const MIN_CHIP_WIDTH = 90;
const ROW_PADDING = 18;
const ROW_MIN_HEIGHT = 104;

const DAY_SHORT = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];

// Zoom-nivåer for dagvisningen: fra kompakt (kun hele timer) til
// detaljert (kvarter med klokkeslett-labels).
const ZOOM_STEPS = [
  { pxPerHour: 80, tick: 60, showMinorLabels: false, label: "Kompakt" },
  { pxPerHour: 120, tick: 30, showMinorLabels: false, label: "Standard" },
  { pxPerHour: 170, tick: 15, showMinorLabels: false, label: "Kvarter" },
  { pxPerHour: 230, tick: 15, showMinorLabels: true, label: "Detaljert" },
  { pxPerHour: 300, tick: 15, showMinorLabels: true, label: "Maks" },
] as const;
const DEFAULT_ZOOM_INDEX = 1;

type Tick = { min: number; kind: "hour" | "half" | "quarter"; label?: string };

function buildTicks(tickMinutes: number, showMinorLabels: boolean): Tick[] {
  const startMin = START_HOUR * 60;
  const endMin = END_HOUR * 60;
  const ticks: Tick[] = [];
  for (let m = startMin; m <= endMin; m += tickMinutes) {
    const isHour = m % 60 === 0;
    const isHalf = !isHour && m % 30 === 0;
    const kind: Tick["kind"] = isHour ? "hour" : isHalf ? "half" : "quarter";
    let label: string | undefined;
    if (isHour || showMinorLabels) {
      const h = Math.floor(m / 60);
      const mm = m % 60;
      label = `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    }
    ticks.push({ min: m, kind, label });
  }
  return ticks;
}

type TaskWithState = Task & {
  state: "available" | "pending" | "approved" | "rejected" | "locked";
  completion?: TaskCompletion;
};

type ViewMode = "day" | "week";

/**
 * Familiekalender — delt mellom to ruter:
 *  - /forelder/dagsplan (embedded=true): nøstet under forelder/layout.tsx,
 *    så sidemenyen forblir montert av Next.js sin egen layout-mekanisme
 *    (ekte persistent-layout-navigasjon, ingen full remount)
 *  - /dagsplan (embedded=false): frittstående, ingen sidemeny — brukes av
 *    barn og på delte "kiosk"-enheter uten at noen PIN er valgt
 */
export default function DagsplanView({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const { session, loading: sessionLoading, error: sessionError } = useSession();
  const [kids, setKids] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [view, setView] = useState<ViewMode>("day");
  const [viewedDate, setViewedDate] = useState(todayIso());
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);

  const realToday = todayIso();

  const load = useCallback(async () => {
    const hid = await getCurrentHouseholdId();
    if (!hid) {
      const { data: orphans } = await supabase.rpc("list_orphan_households");
      if (orphans && (orphans as unknown[]).length > 0) router.replace("/claim");
      else router.replace("/onboarding");
      return;
    }
    const [kRes, tRes, cRes] = await Promise.all([
      supabase.from("profiles").select(PROFILE_SAFE_COLUMNS).eq("role", "child").order("sort_order"),
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

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const getTasksForKidOnDate = useCallback(
    (kid: Profile, dateIso: string): TaskWithState[] => {
      const mine = completions.filter((c) => c.child_id === kid.id);
      const wStart = dateToIso(startOfWeek(new Date(dateIso + "T00:00:00")));
      return tasks
        .filter((t) => !t.assigned_to || t.assigned_to === kid.id)
        .map((task) => {
          const { state, completion } = getTaskState(task, mine, dateIso, wStart);
          return { ...task, state, completion };
        })
        .filter((t) => t.state !== "locked" && t.state !== "rejected");
    },
    [tasks, completions]
  );

  const claimTask = async (task: TaskWithState, kid: Profile, dateIso: string) => {
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
        completion_date: dateIso,
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

  const weekDates = useMemo(() => {
    const monday = startOfWeek(new Date(viewedDate + "T00:00:00"));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return dateToIso(d);
    });
  }, [viewedDate]);

  const { pxPerHour, tick, showMinorLabels } = ZOOM_STEPS[zoomIndex];
  const timelineWidth = (END_HOUR - START_HOUR) * pxPerHour;

  const nowX =
    now.getHours() >= START_HOUR && now.getHours() < END_HOUR
      ? (now.getHours() + now.getMinutes() / 60 - START_HOUR) * pxPerHour
      : null;

  const zoomOut = () => setZoomIndex((i) => Math.max(0, i - 1));
  const zoomIn = () => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1));

  const goPrev = () =>
    setViewedDate((d) => addDaysIso(d, view === "day" ? -1 : -7));
  const goNext = () =>
    setViewedDate((d) => addDaysIso(d, view === "day" ? 1 : 7));
  const goToday = () => setViewedDate(realToday);

  const activeProfile = getActiveProfile();
  const backHref = (() => {
    if (activeProfile?.role === "parent") return "/forelder";
    if (activeProfile?.role === "child" && activeProfile.id) return `/barn?p=${activeProfile.id}`;
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

  const viewedDateObj = new Date(viewedDate + "T00:00:00");
  const dateHeading =
    view === "day"
      ? viewedDateObj.toLocaleDateString("nb-NO", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : (() => {
          const start = new Date(weekDates[0] + "T00:00:00");
          const end = new Date(weekDates[6] + "T00:00:00");
          const sameMonth = start.getMonth() === end.getMonth();
          const fmtDay = (d: Date) => d.getDate();
          const fmtMonth = (d: Date) =>
            d.toLocaleDateString("nb-NO", { month: "long" });
          return sameMonth
            ? `${fmtDay(start)}.–${fmtDay(end)}. ${fmtMonth(end)}`
            : `${fmtDay(start)}. ${fmtMonth(start)} – ${fmtDay(end)}. ${fmtMonth(end)}`;
        })();

  const pageContent = (
    <>
      {/* Header */}
      <div
        className={`z-40 bg-white/95 backdrop-blur border-b border-purple-100 px-4 py-3 shadow-sm ${
          embedded
            ? "sm:sticky sm:top-0 -mx-4 sm:-mx-8 mb-4 sm:mb-0"
            : "sticky top-0"
        }`}
      >
        {!embedded && (
          <div className="flex items-center justify-between max-w-6xl mx-auto mb-2">
            <Link
              href={backHref}
              className="text-purple-600 font-semibold text-sm hover:text-purple-800"
            >
              ← Tilbake
            </Link>
            <div className="font-extrabold text-purple-900 text-xl">
              📅 Familiekalender
            </div>
            <div className="w-16" />
          </div>
        )}
        {embedded && (
          <div className="max-w-6xl mx-auto mb-2 font-extrabold text-purple-900 text-xl">
            📅 Familiekalender
          </div>
        )}

        <div className="flex items-center justify-between max-w-6xl mx-auto gap-2 flex-wrap">
          {/* Dag/uke-navigasjon */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={goPrev}
              className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold flex items-center justify-center"
              aria-label="Forrige"
            >
              ‹
            </button>
            <div className="text-sm font-bold text-purple-800 capitalize min-w-[160px] text-center">
              {dateHeading}
            </div>
            <button
              onClick={goNext}
              className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold flex items-center justify-center"
              aria-label="Neste"
            >
              ›
            </button>
            {viewedDate !== realToday && (
              <button
                onClick={goToday}
                className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-full ml-1"
              >
                I dag
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom — kun relevant i dagvisning */}
            {view === "day" && (
              <div className="flex items-center gap-1 bg-purple-50 rounded-full p-1">
                <button
                  onClick={zoomOut}
                  disabled={zoomIndex === 0}
                  className="w-7 h-7 rounded-full bg-white hover:bg-purple-100 disabled:opacity-30 disabled:hover:bg-white text-purple-700 font-bold flex items-center justify-center text-sm"
                  aria-label="Zoom ut"
                  title="Zoom ut"
                >
                  −
                </button>
                <span className="text-[10px] font-bold text-purple-500 w-14 text-center select-none">
                  {ZOOM_STEPS[zoomIndex].label}
                </span>
                <button
                  onClick={zoomIn}
                  disabled={zoomIndex === ZOOM_STEPS.length - 1}
                  className="w-7 h-7 rounded-full bg-white hover:bg-purple-100 disabled:opacity-30 disabled:hover:bg-white text-purple-700 font-bold flex items-center justify-center text-sm"
                  aria-label="Zoom inn"
                  title="Zoom inn"
                >
                  +
                </button>
              </div>
            )}

            {/* Visningsvalg */}
            <div className="bg-purple-50 rounded-full p-1 inline-flex">
              <button
                onClick={() => setView("day")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                  view === "day" ? "bg-white text-purple-900 shadow-sm" : "text-purple-500"
                }`}
              >
                Dag
              </button>
              <button
                onClick={() => setView("week")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                  view === "week" ? "bg-white text-purple-900 shadow-sm" : "text-purple-500"
                }`}
              >
                Uke
              </button>
            </div>
          </div>
        </div>
      </div>

      {kids.length === 0 ? (
        <div className="p-8 text-center text-purple-500">
          Ingen barn registrert enda.
        </div>
      ) : (
        <div className="max-w-6xl mx-auto pt-4 px-2 sm:px-4">
          <p className="text-center text-xs text-purple-400 mb-3">
            {viewedDate === realToday
              ? "Trykk på en oppgave for å krysse den av — en voksen godkjenner etterpå"
              : "Kun dagens oppgaver kan krysses av"}
          </p>

          <AnimatePresence mode="wait">
            {view === "day" ? (
              <motion.div
                key="day"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DayGrid
                  kids={kids}
                  dateIso={viewedDate}
                  isToday={viewedDate === realToday}
                  nowX={nowX}
                  pxPerHour={pxPerHour}
                  tick={tick}
                  showMinorLabels={showMinorLabels}
                  timelineWidth={timelineWidth}
                  getTasksForKidOnDate={getTasksForKidOnDate}
                  busy={busy}
                  onClaim={claimTask}
                  onUnclaim={unclaimTask}
                />
              </motion.div>
            ) : (
              <motion.div
                key="week"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <WeekGrid
                  kids={kids}
                  weekDates={weekDates}
                  realToday={realToday}
                  getTasksForKidOnDate={getTasksForKidOnDate}
                  busy={busy}
                  onClaim={claimTask}
                  onUnclaim={unclaimTask}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );

  if (embedded) return pageContent;
  return <div className="min-h-screen pb-12">{pageContent}</div>;
}

/* ------------------------------------------------------------------ */
/* Dag-visning: timeplan-rutenett                                      */
/* ------------------------------------------------------------------ */

function DayGrid({
  kids,
  dateIso,
  isToday,
  nowX,
  pxPerHour,
  tick,
  showMinorLabels,
  timelineWidth,
  getTasksForKidOnDate,
  busy,
  onClaim,
  onUnclaim,
}: {
  kids: Profile[];
  dateIso: string;
  isToday: boolean;
  nowX: number | null;
  pxPerHour: number;
  tick: number;
  showMinorLabels: boolean;
  timelineWidth: number;
  getTasksForKidOnDate: (kid: Profile, dateIso: string) => TaskWithState[];
  busy: string | null;
  onClaim: (task: TaskWithState, kid: Profile, dateIso: string) => void;
  onUnclaim: (completionId: string) => void;
}) {
  const ticks = useMemo(
    () => buildTicks(tick, showMinorLabels),
    [tick, showMinorLabels]
  );
  const tickLeft = (t: Tick) => (t.min / 60 - START_HOUR) * pxPerHour;
  const tickLineClass: Record<Tick["kind"], string> = {
    hour: "border-l border-purple-200",
    half: "border-l border-dashed border-purple-100",
    quarter: "border-l border-dotted border-purple-50",
  };

  return (
    <div className="overflow-x-auto no-scrollbar border border-purple-100 rounded-3xl bg-white shadow-md">
      <div style={{ minWidth: GUTTER_WIDTH + ANYTIME_WIDTH + timelineWidth }}>
        {/* Header-rad: klokkeslett */}
        <div
          className="flex bg-gradient-to-b from-purple-50/80 to-white border-b-2 border-purple-100 rounded-t-3xl"
          style={{ height: HEADER_HEIGHT }}
        >
          <div
            className="sticky left-0 z-30 bg-white/95 backdrop-blur flex items-center justify-center border-r border-purple-100 flex-shrink-0 rounded-tl-3xl"
            style={{ width: GUTTER_WIDTH }}
          >
            <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wide">
              Familie
            </span>
          </div>
          <div
            className="sticky z-30 bg-white/95 backdrop-blur flex items-center justify-center border-r-2 border-purple-200 flex-shrink-0"
            style={{ width: ANYTIME_WIDTH, left: GUTTER_WIDTH }}
          >
            <span className="text-xs font-extrabold text-purple-400 uppercase text-center leading-tight">
              Når som helst
            </span>
          </div>
          <div className="relative flex-shrink-0" style={{ width: timelineWidth }}>
            {ticks.map((t) => (
              <div
                key={t.min}
                className={`absolute top-0 bottom-0 flex items-center ${tickLineClass[t.kind]}`}
                style={{ left: tickLeft(t) }}
              >
                {t.label && (
                  <span
                    className={
                      t.kind === "hour"
                        ? "text-xs font-bold text-purple-600 pl-2"
                        : "text-[10px] font-semibold text-purple-400 pl-1.5"
                    }
                  >
                    {t.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rader per familiemedlem */}
        {kids.map((kid, kidIdx) => {
          const kidTasks = getTasksForKidOnDate(kid, dateIso);
          const anytimeTasks = kidTasks.filter((t) => !t.due_time);
          const timedTasks = kidTasks
            .filter((t) => t.due_time)
            .sort((a, b) => (a.due_time ?? "").localeCompare(b.due_time ?? ""));

          const { placed, laneCount } = assignLanes(timedTasks);
          const rowHeight = Math.max(
            ROW_MIN_HEIGHT,
            laneCount * (LANE_HEIGHT + LANE_GAP) + ROW_PADDING * 2
          );

          return (
            <div
              key={kid.id}
              className={`flex ${kidIdx % 2 === 1 ? "bg-purple-50/30" : ""} ${
                kidIdx > 0 ? "border-t border-purple-100" : ""
              }`}
              style={{ minHeight: rowHeight }}
            >
              {/* Gutter: avatar + navn */}
              <div
                className={`sticky left-0 z-20 flex items-center gap-2.5 px-3 border-r border-purple-100 flex-shrink-0 ${
                  kidIdx % 2 === 1 ? "bg-purple-50/90" : "bg-white/95"
                } backdrop-blur`}
                style={{ width: GUTTER_WIDTH }}
              >
                <ProfileAvatar emoji={kid.avatar_emoji} color={kid.avatar_color} size="sm" />
                <div className="min-w-0">
                  <div className="font-extrabold text-purple-900 text-sm truncate">
                    {kid.name}
                  </div>
                  <div className="text-xs text-purple-500 font-semibold">
                    {formatKr(kid.balance_ore)}
                  </div>
                </div>
              </div>

              {/* Når som helst-celle */}
              <div
                className={`sticky z-20 flex flex-col gap-1.5 justify-center p-2 border-r-2 border-purple-200 flex-shrink-0 ${
                  kidIdx % 2 === 1 ? "bg-purple-50/90" : "bg-white/95"
                } backdrop-blur`}
                style={{ width: ANYTIME_WIDTH, left: GUTTER_WIDTH }}
              >
                {anytimeTasks.length === 0 ? (
                  <span className="text-xs text-purple-300 italic text-center">—</span>
                ) : (
                  anytimeTasks.map((t) => (
                    <TaskChip
                      key={t.id}
                      task={t}
                      fullWidth
                      clickable={isToday}
                      busy={busy === `${t.id}-${kid.id}` || busy === t.completion?.id}
                      onTap={() => {
                        if (t.state === "available") onClaim(t, kid, dateIso);
                        else if (t.state === "pending" && t.completion)
                          onUnclaim(t.completion.id);
                      }}
                    />
                  ))
                )}
              </div>

              {/* Tidsrutenett */}
              <div
                className="relative flex-shrink-0"
                style={{ width: timelineWidth, minHeight: rowHeight }}
              >
                {ticks.map((t) => (
                  <div
                    key={t.min}
                    className={`absolute top-0 bottom-0 ${tickLineClass[t.kind]}`}
                    style={{ left: tickLeft(t) }}
                  />
                ))}

                {isToday && nowX !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10 pointer-events-none"
                    style={{ left: nowX }}
                  >
                    <div className="absolute -top-1 -left-[5px] w-3 h-3 rounded-full bg-red-400 ring-2 ring-white" />
                  </div>
                )}

                {placed.map(({ task, lane, startMin }) => {
                  const widthPx = Math.max(
                    MIN_CHIP_WIDTH,
                    (task.duration_minutes / 60) * pxPerHour - 4
                  );
                  return (
                    <div
                      key={task.id}
                      className="absolute"
                      style={{
                        left: (startMin / 60 - START_HOUR) * pxPerHour + 3,
                        top: ROW_PADDING + lane * (LANE_HEIGHT + LANE_GAP),
                        width: widthPx,
                        height: LANE_HEIGHT,
                      }}
                    >
                      <TaskChip
                        task={task}
                        clickable={isToday}
                        busy={busy === `${task.id}-${kid.id}` || busy === task.completion?.id}
                        onTap={() => {
                          if (task.state === "available") onClaim(task, kid, dateIso);
                          else if (task.state === "pending" && task.completion)
                            onUnclaim(task.completion.id);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Uke-visning: 7 dager per barn, enkel liste                          */
/* ------------------------------------------------------------------ */

function WeekGrid({
  kids,
  weekDates,
  realToday,
  getTasksForKidOnDate,
  busy,
  onClaim,
  onUnclaim,
}: {
  kids: Profile[];
  weekDates: string[];
  realToday: string;
  getTasksForKidOnDate: (kid: Profile, dateIso: string) => TaskWithState[];
  busy: string | null;
  onClaim: (task: TaskWithState, kid: Profile, dateIso: string) => void;
  onUnclaim: (completionId: string) => void;
}) {
  return (
    <div className="space-y-5">
      {kids.map((kid) => (
        <div
          key={kid.id}
          className="border border-purple-100 rounded-3xl bg-white shadow-md overflow-hidden"
        >
          <div className="flex items-center gap-2.5 px-4 py-3 bg-purple-50/60 border-b border-purple-100">
            <ProfileAvatar emoji={kid.avatar_emoji} color={kid.avatar_color} size="sm" />
            <div>
              <div className="font-extrabold text-purple-900 text-sm">{kid.name}</div>
              <div className="text-xs text-purple-500 font-semibold">
                {formatKr(kid.balance_ore)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 divide-x divide-purple-100">
            {weekDates.map((dateIso) => {
              const isToday = dateIso === realToday;
              const d = new Date(dateIso + "T00:00:00");
              const dayIdx = d.getDay();
              const dayTasks = getTasksForKidOnDate(kid, dateIso).sort((a, b) =>
                (a.due_time ?? "99:99").localeCompare(b.due_time ?? "99:99")
              );

              return (
                <div key={dateIso} className={isToday ? "bg-purple-50/50" : ""}>
                  <div
                    className={`text-center py-2 border-b border-purple-100 ${
                      isToday ? "bg-purple-600 text-white" : "text-purple-700"
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase">
                      {DAY_SHORT[dayIdx]}
                    </div>
                    <div className="text-sm font-extrabold">{d.getDate()}</div>
                  </div>
                  <div className="p-1.5 space-y-1 min-h-[80px]">
                    {dayTasks.length === 0 ? (
                      <div className="text-[10px] text-purple-300 italic text-center pt-2">
                        —
                      </div>
                    ) : (
                      dayTasks.map((t) => (
                        <WeekTaskRow
                          key={t.id}
                          task={t}
                          clickable={isToday}
                          busy={busy === `${t.id}-${kid.id}` || busy === t.completion?.id}
                          onTap={() => {
                            if (t.state === "available") onClaim(t, kid, dateIso);
                            else if (t.state === "pending" && t.completion)
                              onUnclaim(t.completion.id);
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function WeekTaskRow({
  task,
  onTap,
  busy,
  clickable,
}: {
  task: TaskWithState;
  onTap: () => void;
  busy: boolean;
  clickable: boolean;
}) {
  const isClickable = clickable && (task.state === "available" || task.state === "pending");
  const stateStyles: Record<string, string> = {
    available: "bg-white shadow-sm",
    pending: "bg-amber-50 border border-amber-200",
    approved: "bg-green-50 border border-green-200",
  };
  return (
    <button
      disabled={busy || !isClickable}
      onClick={onTap}
      className={`w-full flex items-center gap-1 rounded-lg px-1.5 py-1 text-left ${
        stateStyles[task.state] ?? "bg-white"
      } ${isClickable ? "active:scale-95" : "cursor-default"}`}
      style={{ borderLeft: `3px solid ${task.color}` }}
      title={task.title}
    >
      <span className="text-[11px] flex-shrink-0">{task.icon}</span>
      <span className="text-[9px] font-bold text-purple-900 truncate flex-1 leading-tight">
        {task.title}
      </span>
      {task.state === "approved" && <span className="text-[8px]">✅</span>}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Oppgave-blokk (dag-visning)                                         */
/* ------------------------------------------------------------------ */

function TaskChip({
  task,
  onTap,
  busy,
  fullWidth,
  clickable,
}: {
  task: TaskWithState;
  onTap: () => void;
  busy: boolean;
  fullWidth?: boolean;
  clickable: boolean;
}) {
  const isClickable = clickable && (task.state === "available" || task.state === "pending");
  const bgAlpha = task.state === "pending" ? "26" : task.state === "approved" ? "26" : "17";
  const opacityClass = !clickable && task.state !== "approved" ? "opacity-60" : "";

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      disabled={busy || !isClickable}
      onClick={onTap}
      className={`flex items-start gap-1.5 rounded-xl px-2 py-1.5 text-left overflow-hidden shadow-sm ${
        fullWidth ? "w-full" : "h-full w-full"
      } ${isClickable ? "active:scale-95 hover:shadow-md" : "cursor-default"} ${opacityClass}`}
      style={{
        background: `${task.color}${bgAlpha}`,
        borderLeft: `4px solid ${task.color}`,
        height: fullWidth ? undefined : LANE_HEIGHT,
      }}
      title={`${task.title}${task.due_time ? " · " + task.due_time.slice(0, 5) : ""} · ${task.duration_minutes} min`}
    >
      <span className="text-sm flex-shrink-0 leading-none mt-0.5">{task.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold text-purple-900 leading-tight line-clamp-2">
          {task.title}
        </span>
        {task.due_time && (
          <span className="block text-[9px] text-purple-500 font-semibold mt-0.5">
            {task.due_time.slice(0, 5)}
          </span>
        )}
      </span>
      {task.state === "pending" && (
        <span className="text-xs flex-shrink-0" title="Venter på godkjenning">
          ⏳
        </span>
      )}
      {task.state === "approved" && (
        <span className="text-xs flex-shrink-0" title="Godkjent">
          ✅
        </span>
      )}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Lane-basert kollisjonshåndtering (som en ekte kalender)              */
/* ------------------------------------------------------------------ */

function assignLanes(tasksSorted: TaskWithState[]): {
  placed: { task: TaskWithState; lane: number; startMin: number }[];
  laneCount: number;
} {
  const laneEndTimes: number[] = [];
  const placed: { task: TaskWithState; lane: number; startMin: number }[] = [];

  for (const task of tasksSorted) {
    const [h, m] = (task.due_time ?? "00:00").split(":").map(Number);
    const startMin = h * 60 + m;
    const endMin = startMin + (task.duration_minutes || 15);

    let lane = laneEndTimes.findIndex((end) => end <= startMin);
    if (lane === -1) {
      lane = laneEndTimes.length;
      laneEndTimes.push(endMin);
    } else {
      laneEndTimes[lane] = endMin;
    }
    placed.push({ task, lane, startMin });
  }

  return { placed, laneCount: Math.max(1, laneEndTimes.length) };
}
