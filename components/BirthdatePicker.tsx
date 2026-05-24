"use client";

import { useMemo } from "react";

const MONTHS = [
  "Januar", "Februar", "Mars", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Desember",
];

type Props = {
  value: string; // YYYY-MM-DD eller tom streng
  onChange: (iso: string) => void;
  minAge?: number; // standard 0
  maxAge?: number; // standard 18
};

export default function BirthdatePicker({
  value,
  onChange,
  minAge = 0,
  maxAge = 18,
}: Props) {
  const [year, month, day] = useMemo(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return ["", "", ""] as const;
    const [y, m, d] = value.split("-");
    return [y, String(parseInt(m, 10)), String(parseInt(d, 10))] as const;
  }, [value]);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = currentYear - minAge; y >= currentYear - maxAge; y--) arr.push(y);
    return arr;
  }, [currentYear, minAge, maxAge]);

  const daysInMonth = useMemo(() => {
    if (!year || !month) return 31;
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  }, [year, month]);

  const updatePart = (part: "day" | "month" | "year", newValue: string) => {
    const d = part === "day" ? newValue : day;
    const m = part === "month" ? newValue : month;
    const y = part === "year" ? newValue : year;
    if (d && m && y) {
      const maxDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      const safeDay = Math.min(parseInt(d), maxDay);
      onChange(
        `${y}-${String(parseInt(m)).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`
      );
    } else {
      // Partial state — bygg en pseudo-streng så vi kan vise valgte verdier
      onChange(
        `${y || "0000"}-${(m || "00").padStart(2, "0")}-${(d || "00").padStart(2, "0")}`
      );
    }
  };

  const isComplete = year && month && day && year !== "0000" && month !== "00" && day !== "00";

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-3 gap-2">
        <select
          value={day}
          onChange={(e) => updatePart("day", e.target.value)}
          className="px-2 py-2 rounded-xl border-2 border-purple-200 outline-none bg-white text-sm font-semibold text-purple-900"
        >
          <option value="">Dag</option>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => updatePart("month", e.target.value)}
          className="px-2 py-2 rounded-xl border-2 border-purple-200 outline-none bg-white text-sm font-semibold text-purple-900"
        >
          <option value="">Måned</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => updatePart("year", e.target.value)}
          className="px-2 py-2 rounded-xl border-2 border-purple-200 outline-none bg-white text-sm font-semibold text-purple-900"
        >
          <option value="">År</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      {isComplete && (
        <div className="text-[11px] text-purple-500 font-medium">
          {currentYear - parseInt(year)} år
        </div>
      )}
    </div>
  );
}
