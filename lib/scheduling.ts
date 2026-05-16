import type { Task, TaskCompletion } from "./types";

/** Bestem om en oppgave er "tilgjengelig" for et gitt datum,
 * basert på recurrence-regler. Tar IKKE hensyn til om den allerede er
 * markert i dag — det sjekkes separat. */
export function isTaskValidForDate(task: Task, dateIso: string): boolean {
  if (task.start_date && dateIso < task.start_date) return false;
  if (task.end_date && dateIso > task.end_date) return false;
  switch (task.recurrence) {
    case "daily":
      return true;
    case "weekly":
      return true; // tilgjengelig hver dag i uka, men kun én gang
    case "once":
      return true;
    case "days_of_week": {
      const day = new Date(dateIso + "T00:00:00").getDay(); // 0=søn..6=lør
      return Array.isArray(task.days_of_week) && task.days_of_week.includes(day);
    }
    case "interval":
      return true; // tilgjengeligheten styres av siste fullføring
    default:
      return true;
  }
}

/** Bestem state for en oppgave akkurat nå for et barn.
 *  Returnerer: { state, completion } der state er
 *  "available" | "pending" | "approved" | "rejected" | "locked" */
export function getTaskState(
  task: Task,
  completions: TaskCompletion[],
  today: string,
  weekStart: string
): {
  state: "available" | "pending" | "approved" | "rejected" | "locked";
  completion?: TaskCompletion;
  nextAvailableDate?: string;
} {
  // Først: er oppgaven gyldig i dag?
  if (!isTaskValidForDate(task, today)) {
    return { state: "locked" };
  }

  const mine = completions
    .filter((c) => c.task_id === task.id)
    .sort((a, b) => b.completion_date.localeCompare(a.completion_date));

  if (task.recurrence === "once") {
    const active = mine.find((c) => c.status !== "rejected");
    if (active) return { state: active.status as never, completion: active };
    return { state: "available" };
  }

  if (task.recurrence === "weekly") {
    const inWeek = mine.find((c) => c.completion_date >= weekStart);
    if (inWeek) return { state: inWeek.status as never, completion: inWeek };
    return { state: "available" };
  }

  if (task.recurrence === "interval") {
    const last = mine.find((c) => c.status !== "rejected");
    if (!last) return { state: "available" };
    if (last.completion_date === today) {
      return { state: last.status as never, completion: last };
    }
    const daysSince = daysBetween(last.completion_date, today);
    const need = task.interval_days ?? 1;
    if (daysSince < need) {
      const next = addDays(last.completion_date, need);
      return { state: "locked", nextAvailableDate: next };
    }
    return { state: "available" };
  }

  // daily eller days_of_week: én gang per dag
  const todayEntry = mine.find((c) => c.completion_date === today);
  if (todayEntry) return { state: todayEntry.status as never, completion: todayEntry };
  return { state: "available" };
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86400000);
}

export function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const DAY_NAMES = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
export const DAY_NAMES_LONG = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];

export function describeRecurrence(task: Task): string {
  switch (task.recurrence) {
    case "daily":
      return "Hver dag";
    case "weekly":
      return "Hver uke";
    case "once":
      return "Engangs";
    case "days_of_week": {
      const days = task.days_of_week ?? [];
      if (days.length === 0) return "Ingen valgte dager";
      const sorted = [...days].sort();
      // Vis spesielle navn
      if (sorted.join(",") === "1,2,3,4,5") return "Hverdager";
      if (sorted.join(",") === "0,6") return "Helger";
      if (sorted.length === 7) return "Hver dag";
      return sorted.map((d) => DAY_NAMES[d]).join(", ");
    }
    case "interval":
      return `Hver ${task.interval_days ?? 1}. dag`;
    default:
      return "";
  }
}
