"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const AUTH_TIMEOUT_MS = 8000;

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Timeout som garanterer at vi aldri henger uendelig på 🌟
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
        setError("Auth tok for lang tid. Prøv å laste siden på nytt.");
      }
    }, AUTH_TIMEOUT_MS);

    supabase.auth
      .getSession()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
        } else {
          setSession(data.session);
        }
        setLoading(false);
        clearTimeout(timeout);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Ukjent auth-feil");
        setLoading(false);
        clearTimeout(timeout);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (cancelled) return;
      // Reager på alle relevante events så UI ikke setter seg fast
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED" ||
        event === "INITIAL_SESSION"
      ) {
        setSession(s);
        setLoading(false);
        setError(null);
        clearTimeout(timeout);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading, error };
}
