"use client";

import type { Profile } from "./types";

const STORAGE_KEY = "ukeslonn:active-profile";

export function setActiveProfile(profile: Profile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: profile.id, role: profile.role, name: profile.name }));
}

export function getActiveProfile(): { id: string; role: string; name: string } | null {
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
