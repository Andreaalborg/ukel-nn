"use client";

import { getLevel } from "@/lib/levels";

export default function XpBar({ xp, color = "#8b5cf6" }: { xp: number; color?: string }) {
  const info = getLevel(xp);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5 text-sm">
        <div className="flex items-center gap-1.5 font-bold text-purple-900">
          <span className="text-lg">{info.icon}</span>
          <span>Nivå {info.level}</span>
          <span className="text-purple-500 font-medium">· {info.title}</span>
        </div>
        <div className="text-purple-500 font-medium text-xs">
          {info.nextTitle ? `${info.xpIntoLevel}/${info.xpForNextLevel} XP` : "Max!"}
        </div>
      </div>
      <div className="h-3 w-full bg-purple-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 shine"
          style={{
            width: `${info.progress}%`,
            background: `linear-gradient(90deg, ${color}, #ec4899)`,
          }}
        />
      </div>
    </div>
  );
}
