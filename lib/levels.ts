// XP-system for gamification.
// Hver godkjent oppgave gir XP = belønning i øre / 10 (10 kr -> 100 XP)
// Pluss en liten bonus for hver bonus oppnådd.

export const LEVELS = [
  { level: 1, xp: 0, title: "Hjelper", icon: "🌱" },
  { level: 2, xp: 200, title: "Lærling", icon: "🪴" },
  { level: 3, xp: 500, title: "Stjernehjelper", icon: "⭐" },
  { level: 4, xp: 1000, title: "Mester", icon: "🌟" },
  { level: 5, xp: 1750, title: "Superhelt", icon: "🦸" },
  { level: 6, xp: 2750, title: "Champion", icon: "🏆" },
  { level: 7, xp: 4000, title: "Legende", icon: "🐉" },
  { level: 8, xp: 5500, title: "Drage", icon: "🔥" },
  { level: 9, xp: 7500, title: "Galakse-helt", icon: "🚀" },
  { level: 10, xp: 10000, title: "Magisk Konge", icon: "👑" },
];

export type LevelInfo = {
  level: number;
  title: string;
  icon: string;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number;
  nextTitle: string | null;
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
    xp,
    xpIntoLevel,
    xpForNextLevel,
    progress,
    nextTitle: next?.title ?? null,
  };
}

export function xpForReward(rewardOre: number): number {
  return Math.max(10, Math.round(rewardOre / 10));
}
