// XP-system for gamification.
// Hver oppgave gir XP basert på task.xp_value (default 10).
// XP nullstilles for hver periode (besøk eller uke).
//
// Balansering:
// Minimum-mål: 3 oppg × 5 hverdager + 2 oppg × 2 helgedager = 19 oppgaver/uke
//   → 19 × 10 = 190 XP → Level 7 (Legende-nivå)
// For å nå Level 10 trengs 28 oppgaver/uke
//   → 28 × 10 = 280 XP → Level 10 ✨
// Med flere oppgaver per dag når man enkelt level 10.

export const LEVELS = [
  { level: 1, xp: 0, title: "Hjelper", icon: "🌱", color: "#10b981" },
  { level: 2, xp: 30, title: "Lærling", icon: "🪴", color: "#22c55e" },
  { level: 3, xp: 60, title: "Stjernehjelper", icon: "⭐", color: "#84cc16" },
  { level: 4, xp: 90, title: "Mester", icon: "🌟", color: "#eab308" },
  { level: 5, xp: 120, title: "Superhelt", icon: "🦸", color: "#f59e0b" },
  { level: 6, xp: 150, title: "Champion", icon: "🏆", color: "#f97316" },
  { level: 7, xp: 180, title: "Legende", icon: "🐉", color: "#ef4444" },
  { level: 8, xp: 210, title: "Drage", icon: "🔥", color: "#ec4899" },
  { level: 9, xp: 240, title: "Galakse-helt", icon: "🚀", color: "#a855f7" },
  { level: 10, xp: 280, title: "Magisk Konge", icon: "👑", color: "#8b5cf6" },
];

export const MAX_LEVEL = 10;
export const MAX_LEVEL_XP = 280;

export type LevelInfo = {
  level: number;
  title: string;
  icon: string;
  color: string;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number;
  nextTitle: string | null;
  nextIcon: string | null;
  isMax: boolean;
};

export function getLevel(xp: number): LevelInfo {
  let current = LEVELS[0];
  let next = LEVELS[1] ?? null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }
  const xpIntoLevel = xp - current.xp;
  const xpForNextLevel = next ? next.xp - current.xp : 0;
  const progress = next ? Math.min(100, (xpIntoLevel / xpForNextLevel) * 100) : 100;
  return {
    level: current.level,
    title: current.title,
    icon: current.icon,
    color: current.color,
    xp,
    xpIntoLevel,
    xpForNextLevel,
    progress,
    nextTitle: next?.title ?? null,
    nextIcon: next?.icon ?? null,
    isMax: !next,
  };
}

export function xpForTask(task: { xp_value?: number | null }): number {
  return task.xp_value ?? 10;
}
