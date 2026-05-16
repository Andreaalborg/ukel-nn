"use client";

type Props = {
  emoji: string;
  color: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZES = {
  sm: "w-12 h-12 text-2xl",
  md: "w-20 h-20 text-4xl",
  lg: "w-28 h-28 text-5xl",
  xl: "w-40 h-40 text-7xl",
};

export default function ProfileAvatar({ emoji, color, size = "md", className = "" }: Props) {
  return (
    <div
      className={`${SIZES[size]} rounded-full flex items-center justify-center shadow-lg ${className}`}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${color}ff, ${color}cc)`,
        boxShadow: `0 8px 24px ${color}66`,
      }}
    >
      <span style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}>{emoji}</span>
    </div>
  );
}
