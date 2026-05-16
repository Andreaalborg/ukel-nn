"use client";

import { getLevel, MAX_LEVEL_XP } from "@/lib/levels";

type Props = {
  xp: number;
  color?: string;
  onClick?: () => void;
  variant?: "light" | "dark"; // dark = white text on colored bg
};

export default function XpBar({ xp, color = "#8b5cf6", onClick, variant = "light" }: Props) {
  const info = getLevel(xp);
  const totalProgress = Math.min(100, (xp / MAX_LEVEL_XP) * 100);
  const Wrapper = onClick ? "button" : "div";
  const isDark = variant === "dark";
  return (
    <Wrapper
      onClick={onClick}
      className={`w-full text-left ${onClick ? "active:scale-[0.98] transition-transform" : ""}`}
    >
      <div className="flex items-center justify-between mb-1.5 text-sm">
        <div className={`flex items-center gap-1.5 font-bold ${isDark ? "text-white" : "text-purple-900"}`}>
          <span className="text-lg">{info.icon}</span>
          <span>Nivå {info.level}</span>
          <span className={`font-medium ${isDark ? "opacity-80" : "text-purple-500"}`}>· {info.title}</span>
        </div>
        <div className={`font-medium text-xs ${isDark ? "opacity-80" : "text-purple-500"}`}>
          {info.isMax ? "MAX! 👑" : `${info.xpIntoLevel}/${info.xpForNextLevel} XP`}
        </div>
      </div>
      <div className={`h-3 w-full rounded-full overflow-hidden ${isDark ? "bg-white/30" : "bg-purple-100"}`}>
        <div
          className="h-full rounded-full transition-all duration-700 shine"
          style={{
            width: `${info.progress}%`,
            background: isDark
              ? `linear-gradient(90deg, ${color}, #fff)`
              : `linear-gradient(90deg, ${color}, #ec4899)`,
          }}
        />
      </div>
      {onClick && (
        <div className={`text-[10px] mt-0.5 font-medium ${isDark ? "text-white/70" : "text-purple-400"}`}>
          {totalProgress.toFixed(0)}% til Magisk Konge · trykk for å se alle nivåer
        </div>
      )}
    </Wrapper>
  );
}
