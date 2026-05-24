"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const CALLBACK_TIMEOUT_MS = 10000;

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let handled = false;

    const routeAfterAuth = async (userId: string) => {
      if (handled) return;
      handled = true;
      try {
        const { data: members } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", userId)
          .limit(1);
        if (members && members.length > 0) {
          router.replace("/");
          return;
        }
        const { data: orphans } = await supabase.rpc("list_orphan_households");
        if (orphans && (orphans as unknown[]).length > 0) {
          router.replace("/claim");
        } else {
          router.replace("/onboarding");
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Kunne ikke laste konto-informasjon");
      }
    };

    // 1) Lytt etter auth events først (Supabase detectSessionInUrl er asynkron)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") &&
        session?.user
      ) {
        routeAfterAuth(session.user.id);
      } else if (event === "SIGNED_OUT") {
        router.replace("/auth/signin");
      }
    });

    // 2) Best-effort sjekk for eksisterende sesjon (i tilfelle vi allerede var logget inn)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user && !handled) {
        routeAfterAuth(data.session.user.id);
      }
    });

    // 3) Timeout-fallback
    const timeout = setTimeout(() => {
      if (!handled) {
        setError(
          "Bekreftelsen tok for lang tid. Prøv å logge inn med e-post og passord."
        );
      }
    }, CALLBACK_TIMEOUT_MS);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-6 max-w-md text-center space-y-3">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-purple-900">Noe gikk galt</h2>
          <p className="text-purple-700 text-sm">{error}</p>
          <Link href="/auth/signin" className="btn-primary inline-block">
            Til innlogging
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-6xl animate-float">🌟</div>
    </div>
  );
}
