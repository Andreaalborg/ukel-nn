"use client";

import { LEVELS, getLevel } from "@/lib/levels";
import { motion } from "framer-motion";

export default function LevelsModal({
  xp,
  onClose,
}: {
  xp: number;
  onClose: () => void;
}) {
  const info = getLevel(xp);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-extrabold text-purple-900">Nivåene</h2>
          <button onClick={onClose} className="text-2xl text-purple-400">
            ✕
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 mb-4 text-center">
          <div className="text-5xl mb-1">{info.icon}</div>
          <div className="font-extrabold text-purple-900 text-xl">{info.title}</div>
          <div className="text-sm text-purple-600 font-semibold">Nivå {info.level} av 10</div>
          <div className="text-xs text-purple-500 mt-1">
            {info.isMax
              ? "Du har nådd høyeste nivå! 👑"
              : `${info.xpForNextLevel - info.xpIntoLevel} XP igjen til ${info.nextTitle}`}
          </div>
        </div>

        <div className="space-y-2">
          {LEVELS.map((lvl, i) => {
            const reached = xp >= lvl.xp;
            const isCurrent = info.level === lvl.level;
            const next = LEVELS[i + 1];
            const needed = next ? next.xp - lvl.xp : 0;
            const tasks = needed > 0 ? Math.ceil(needed / 10) : 0;
            return (
              <div
                key={lvl.level}
                className={`rounded-2xl p-3 flex items-center gap-3 transition-all ${
                  isCurrent
                    ? "bg-purple-100 ring-2 ring-purple-400 scale-[1.02]"
                    : reached
                    ? "bg-green-50"
                    : "bg-gray-50"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    reached ? "" : "grayscale opacity-50"
                  }`}
                  style={{ background: `${lvl.color}33` }}
                >
                  {lvl.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-purple-900 flex items-center gap-2">
                    {lvl.title}
                    {isCurrent && (
                      <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        DU ER HER
                      </span>
                    )}
                    {reached && !isCurrent && <span className="text-green-600">✓</span>}
                  </div>
                  <div className="text-xs text-purple-500 font-semibold">
                    Nivå {lvl.level} · {lvl.xp} XP
                    {tasks > 0 && next && ` (~${tasks} oppgaver til ${next.title})`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 bg-amber-50 rounded-2xl p-3 text-sm text-amber-900 font-semibold flex items-start gap-2">
          <span className="text-xl">🔥</span>
          <span>
            Tips: Klarer du Level 10 tre perioder på rad får du en streak-bonus!
          </span>
        </div>

        <button onClick={onClose} className="btn-primary w-full mt-4">
          Lukk
        </button>
      </motion.div>
    </div>
  );
}
