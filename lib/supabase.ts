"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Ukeslønn] Mangler Supabase-konfig. Sett NEXT_PUBLIC_SUPABASE_URL og NEXT_PUBLIC_SUPABASE_ANON_KEY i .env.local"
  );
}

export const supabase = createBrowserClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Hent gjeldende household_id for innlogget bruker.
 *  Verifiserer alltid mot DB at brukeren faktisk er medlem av den cachede
 *  husholdningen — ellers fjerner vi cachen og slår opp på nytt. */
export async function getCurrentHouseholdId(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    localStorage.removeItem("ukeslonn:household_id");
    return null;
  }

  const cached = localStorage.getItem("ukeslonn:household_id");

  // Hent alle husholdninger brukeren faktisk er medlem av
  const { data: memberships } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id);

  const validIds = (memberships ?? []).map((m) => m.household_id as string);

  if (validIds.length === 0) {
    localStorage.removeItem("ukeslonn:household_id");
    return null;
  }

  // Hvis cache er en av de gyldige, bruk den
  if (cached && validIds.includes(cached)) return cached;

  // Ellers ta første gyldige husholdning og oppdater cache
  const fallback = validIds[0];
  localStorage.setItem("ukeslonn:household_id", fallback);
  return fallback;
}

export function setCurrentHouseholdId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("ukeslonn:household_id", id);
}

export function clearCurrentHouseholdId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("ukeslonn:household_id");
}
