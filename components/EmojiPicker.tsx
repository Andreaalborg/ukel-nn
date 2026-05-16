"use client";

import { useState } from "react";

const TASK_EMOJIS = [
  "⭐", "🛏️", "🪥", "🧹", "🍽️", "📚", "📖", "🍳", "🗑️", "🧺",
  "🧸", "🐶", "🐱", "🌱", "💧", "🚿", "👕", "🧦", "🎒", "✏️",
  "🎨", "🎵", "🏃", "⚽", "🚴", "🧘", "🧠", "💪", "❤️", "🏆",
];

const PROFILE_EMOJIS = [
  "🦁", "🐯", "🐻", "🐼", "🦄", "🦖", "🐉", "🦊", "🐰", "🐸",
  "🐵", "🐱", "🐶", "🐺", "🦉", "🐧", "🦋", "🐬", "🦈", "🐙",
  "👑", "🦸", "🧙", "🧚", "🤖", "👽", "🎃", "⭐", "🌟", "✨",
];

const BONUS_EMOJIS = [
  "🏆", "🎁", "🎉", "🎊", "🥇", "🌟", "💎", "👑", "🎈", "🍦",
  "🍰", "🍕", "🍔", "🎮", "🎬", "🎨", "🎢", "🏖️", "🚀", "💰",
];

const COLORS = [
  "#FFD93D", "#EC4899", "#3B82F6", "#10B981", "#A78BFA", "#F59E0B",
  "#EF4444", "#06B6D4", "#84CC16", "#F97316", "#8B5CF6", "#14B8A6",
];

type Props = {
  value: string;
  onChange: (emoji: string) => void;
  type?: "task" | "profile" | "bonus";
};

export function EmojiPicker({ value, onChange, type = "task" }: Props) {
  const [open, setOpen] = useState(false);
  const list = type === "profile" ? PROFILE_EMOJIS : type === "bonus" ? BONUS_EMOJIS : TASK_EMOJIS;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-2xl bg-purple-50 border-2 border-purple-200 text-3xl flex items-center justify-center hover:bg-purple-100"
      >
        {value}
      </button>
      {open && (
        <div className="absolute z-30 mt-2 left-0 card p-3 grid grid-cols-6 gap-1 w-72">
          {list.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                onChange(e);
                setOpen(false);
              }}
              className={`w-10 h-10 text-2xl rounded-lg hover:bg-purple-100 ${value === e ? "bg-purple-100 ring-2 ring-purple-400" : ""}`}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-9 h-9 rounded-full transition-transform ${value === c ? "ring-4 ring-purple-300 scale-110" : ""}`}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}
