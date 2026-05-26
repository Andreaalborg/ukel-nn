"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, getCurrentHouseholdId } from "./supabase";
import type { Household } from "./types";

export type PremiumInfo = {
  isPremium: boolean;
  household: Household | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

/** Sjekker om husholdningen har Premium-tilgang akkurat nå.
 *  Premium gjelder hvis ÉN av disse er sant:
 *   - lifetime = true
 *   - subscription_status = 'active' eller 'trialing'
 *   - trial_ends_at > nå
 *   - comp_until > nå  (gratis Premium gitt av oss til testbrukere) */
export function usePremium(): PremiumInfo {
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const hid = await getCurrentHouseholdId();
    if (!hid) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("households")
      .select("*")
      .eq("id", hid)
      .single();
    if (data) setHousehold(data as Household);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const now = Date.now();
  const isPremium = household
    ? household.lifetime ||
      household.subscription_status === "active" ||
      household.subscription_status === "trialing" ||
      (household.trial_ends_at &&
        new Date(household.trial_ends_at).getTime() > now) ||
      (household.comp_until && new Date(household.comp_until).getTime() > now)
    : false;

  return { isPremium: Boolean(isPremium), household, loading, refresh: load };
}

/** Konstanter for gratis-grenser */
export const FREE_LIMITS = {
  maxKids: 1,
  maxTasks: 10,
} as const;
