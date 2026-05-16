export function formatKr(ore: number): string {
  const kr = ore / 100;
  if (Number.isInteger(kr)) return `${kr} kr`;
  return `${kr.toFixed(2).replace(".", ",")} kr`;
}

export function kronerToOre(kr: number): number {
  return Math.round(kr * 100);
}

export function getAge(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date = new Date()): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 10) return "God morgen";
  if (h < 17) return "Hei";
  return "God kveld";
}
