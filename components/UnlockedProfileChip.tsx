"use client";

import { getProfileSession } from "@/lib/auth";
import { useEffect, useState } from "react";

type Props = {
  onSwitch: () => void;
  /** Compact for tight headers */
  compact?: boolean;
};

/**
 * Synlig «ulåst profil»-chip: hvem er aktiv + Bytt.
 */
export default function UnlockedProfileChip({ onSwitch, compact }: Props) {
  const [label, setLabel] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const s = getProfileSession();
    if (!s) {
      setLabel(null);
      return;
    }
    setLabel({
      name: s.name,
      role: s.role === "parent" ? "Forelder" : "Barn",
    });
  }, []);

  if (!label) return null;

  return (
    <div
      className={`flex items-center gap-2 rounded-full bg-purple-50 border border-purple-100 ${
        compact ? "pl-2 pr-1 py-1" : "pl-3 pr-1.5 py-1.5"
      }`}
      title={`Ulåst som ${label.name} (${label.role})`}
    >
      <div className="min-w-0">
        <div className={`font-extrabold text-purple-900 truncate ${compact ? "text-xs" : "text-sm"}`}>
          {label.name}
        </div>
        {!compact && (
          <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wide leading-none">
            Ulåst · {label.role}
          </div>
        )}
        {compact && (
          <div className="text-[9px] font-bold text-purple-500 leading-none">Ulåst</div>
        )}
      </div>
      <button
        type="button"
        onClick={onSwitch}
        className={`shrink-0 font-bold text-purple-700 bg-white border border-purple-200 rounded-full hover:bg-purple-100 active:scale-95 ${
          compact ? "text-xs px-2.5 py-1" : "text-sm px-3 py-1.5"
        }`}
        aria-label="Bytt profil"
      >
        Bytt
      </button>
    </div>
  );
}
