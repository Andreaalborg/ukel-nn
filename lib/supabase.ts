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

/** Hent gjeldende household_id for innlogget bruker (cachet i localStorage) */
export async function getCurrentHouseholdId(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem("ukeslonn:household_id");
  if (cached) return cached;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (data?.household_id) {
    localStorage.setItem("ukeslonn:household_id", data.household_id);
    return data.household_id;
  }
  return null;
}

export function setCurrentHouseholdId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("ukeslonn:household_id", id);
}

export function clearCurrentHouseholdId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("ukeslonn:household_id");
}
