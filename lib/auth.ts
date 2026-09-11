"use client";

import type { Profile, Role } from "./types";
import { clearCurrentHouseholdId, supabase } from "./supabase";

const STORAGE_KEY = "ukeslonn:profile-session";
/** Legacy key from pre-v11 PIN client gate — cleared on logout. */
const LEGACY_STORAGE_KEY = "ukeslonn:active-profile";

export type ProfileSession = {
  session_token: string;
  profile_id: string;
  role: Role | string;
  name: string;
  household_id: string;
  expires_at: string;
};

/** Kolonner som er trygge å SELECT fra profiles (uten pin / pin_hash). */
export const PROFILE_SAFE_COLUMNS =
  "id, household_id, name, role, avatar_color, avatar_emoji, birthdate, xp, balance_ore, sort_order, created_at";

export function setProfileSession(session: ProfileSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function getProfileSession(): ProfileSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ProfileSession;
    if (!parsed?.session_token || !parsed?.profile_id) return null;
    if (parsed.expires_at && new Date(parsed.expires_at).getTime() <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getProfileSessionToken(): string | null {
  return getProfileSession()?.session_token ?? null;
}

export async function clearProfileSession() {
  if (typeof window === "undefined") return;
  const token = getProfileSessionToken();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  if (token) {
    try {
      await supabase.rpc("clear_profile_session", { p_token: token });
    } catch {
      // best-effort server clear
    }
  }
}

/** Synkron lokal clear (uten RPC) — brukes når server allerede slettet sesjon. */
export function clearProfileSessionLocal() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

/**
 * Bakoverkompatibel: aktiv PIN-profil uten plaintext PIN.
 * id = profile_id fra server-sesjon.
 */
export function setActiveProfile(
  profile: Pick<Profile, "id" | "role" | "name" | "household_id"> & {
    session_token?: string;
    expires_at?: string;
  }
) {
  if (!profile.session_token) {
    console.warn("[auth] setActiveProfile uten session_token — bruk setProfileSession");
    return;
  }
  setProfileSession({
    session_token: profile.session_token,
    profile_id: profile.id,
    role: profile.role,
    name: profile.name,
    household_id: profile.household_id,
    expires_at: profile.expires_at ?? new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  });
}

export function getActiveProfile():
  | { id: string; role: string; name: string; household_id: string }
  | null {
  const s = getProfileSession();
  if (!s) return null;
  return {
    id: s.profile_id,
    role: s.role,
    name: s.name,
    household_id: s.household_id,
  };
}

export function clearActiveProfile() {
  clearProfileSessionLocal();
}

/** Full logout: rydder profil-sesjon (RPC), household-cache OG Supabase Auth. */
export async function logout() {
  await clearProfileSession();
  clearCurrentHouseholdId();
  await supabase.auth.signOut();
}
