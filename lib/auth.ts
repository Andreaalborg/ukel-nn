"use client";

import type { Profile } from "./types";
import { clearCurrentHouseholdId, supabase } from "./supabase";

const STORAGE_KEY = "ukeslonn:active-profile";

/** Den valgte PIN-profilen på denne enheten (kid/parent-rolle).
 *  Auth-sesjonen (Supabase) er separat og styrer tilgang til husholdningen. */
export function setActiveProfile(profile: Profile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      id: profile.id,
      role: profile.role,
      name: profile.name,
      household_id: profile.household_id,
    })
  );
}

export function getActiveProfile():
  | { id: string; role: string; name: string; household_id: string }
  | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearActiveProfile() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Full logout: rydder PIN-profil, household-cache OG Supabase Auth-sesjon */
export async function logout() {
  clearActiveProfile();
  clearCurrentHouseholdId();
  await supabase.auth.signOut();
}
