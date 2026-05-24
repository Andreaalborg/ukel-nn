"use client";

export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

export function computeStrength(password: string): {
  level: StrengthLevel;
  label: string;
  color: string;
} {
  if (!password) return { level: 0, label: "", color: "#e9d5ff" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-zæøå]/i.test(password) && /\d/.test(password)) score++;
  if (/[^a-zA-Z0-9æøåÆØÅ]/.test(password)) score++;

  const levels: { label: string; color: string }[] = [
    { label: "For kort", color: "#ef4444" },
    { label: "Svakt", color: "#f97316" },
    { label: "OK", color: "#eab308" },
    { label: "Bra", color: "#10b981" },
    { label: "Sterkt", color: "#059669" },
  ];

  const level = Math.min(score, 4) as StrengthLevel;
  return { level, label: levels[level].label, color: levels[level].color };
}

export const MIN_PASSWORD_LENGTH = 8;

export default function PasswordStrength({ password }: { password: string }) {
  const { level, label, color } = computeStrength(password);
  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full transition-colors"
            style={{
              background: i < level ? color : "#e9d5ff",
            }}
          />
        ))}
      </div>
      {password && (
        <div className="text-[11px] font-bold mt-1" style={{ color }}>
          {label}
          {password.length < MIN_PASSWORD_LENGTH &&
            ` (minst ${MIN_PASSWORD_LENGTH} tegn)`}
        </div>
      )}
    </div>
  );
}
