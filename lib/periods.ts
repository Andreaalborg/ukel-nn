import type { CustodyPeriod } from "./types";
import { startOfWeek, todayIso } from "./utils";

export type PeriodWindow = {
  start: string;
  end: string;
  label: string;
  custodyId: string | null;
};

/** Hent gjeldende periode for et barn — enten en custody-periode i dag,
 * eller en kalenderuke som fallback. */
export function getCurrentPeriod(
  periods: CustodyPeriod[],
  childId: string,
  date = new Date()
): PeriodWindow {
  const today = date.toISOString().slice(0, 10);
  const active = periods
    .filter((p) => p.child_id === childId && !p.closed)
    .find((p) => p.start_date <= today && p.end_date >= today);
  if (active) {
    return {
      start: active.start_date,
      end: active.end_date,
      label: active.label || formatPeriodLabel(active.start_date, active.end_date),
      custodyId: active.id,
    };
  }
  // Fallback: nåværende kalenderuke (man-søn)
  const ws = startOfWeek(date);
  const we = new Date(ws);
  we.setDate(ws.getDate() + 6);
  return {
    start: ws.toISOString().slice(0, 10),
    end: we.toISOString().slice(0, 10),
    label: `Uke ${getWeekNumber(date)}`,
    custodyId: null,
  };
}

/** Liste alle perioder for barnet, sortert nyest først.
 * Hvis ingen custody-perioder, returner en virtuell for inneværende uke. */
export function listPeriodsFor(
  periods: CustodyPeriod[],
  childId: string
): PeriodWindow[] {
  const list = periods
    .filter((p) => p.child_id === childId)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map<PeriodWindow>((p) => ({
      start: p.start_date,
      end: p.end_date,
      label: p.label || formatPeriodLabel(p.start_date, p.end_date),
      custodyId: p.id,
    }));
  if (list.length === 0) return [getCurrentPeriod(periods, childId)];
  return list;
}

export function formatPeriodLabel(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `${fmt(s)} – ${fmt(e)}`;
}

export function getWeekNumber(date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function isDateInWindow(date: string, win: PeriodWindow): boolean {
  return date >= win.start && date <= win.end;
}

export function isPeriodEnded(win: PeriodWindow, today = todayIso()): boolean {
  return today > win.end;
}

/** Periodens varighet i dager (inklusivt). */
export function periodDays(win: PeriodWindow): number {
  const s = new Date(win.start);
  const e = new Date(win.end);
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}
