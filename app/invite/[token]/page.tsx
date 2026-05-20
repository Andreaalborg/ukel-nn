"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured, setCurrentHouseholdId } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import type { Household, HouseholdInvite } from "@/lib/types";
import SetupNotice from "@/components/SetupNotice";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [invite, setInvite] = useState<(HouseholdInvite & { households: Household | null }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase
        .from("household_invites")
        .select("*, households(*)")
        .eq("token", token)
        .single();
      if (error || !data) {
        setError("Invitasjonen finnes ikke eller er utløpt.");
      } else if (data.accepted_at) {
        setError("Invitasjonen er allerede akseptert.");
      } else if (new Date(data.expires_at) < new Date()) {
        setError("Invitasjonen er utløpt.");
      } else {
        setInvite(data as never);
      }
      setLoading(false);
    })();
  }, [token]);

  const accept = async () => {
    if (!session || !invite) return;
    setAccepting(true);
    const { data, error: rpcErr } = await supabase.rpc("accept_household_invite", {
      p_token: invite.token,
    });
    if (rpcErr || !data) {
      setError(rpcErr?.message ?? "Kunne ikke akseptere invitasjonen");
      setAccepting(false);
      return;
    }
    setCurrentHouseholdId(data as string);
    router.push("/forelder");
  };

  if (!isSupabaseConfigured) return <SetupNotice />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-6xl animate-float">🌟</div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-6 max-w-md text-center space-y-3">
          <div className="text-5xl">❌</div>
          <h2 className="text-xl font-bold text-purple-900">Invitasjon ugyldig</h2>
          <p className="text-purple-700 text-sm">{error}</p>
          <Link href="/" className="btn-primary inline-block">
            Til forsiden
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card p-6 max-w-md w-full text-center space-y-3">
        <div className="text-5xl animate-float">✉️</div>
        <h1 className="text-2xl font-extrabold text-purple-900">Du er invitert!</h1>
        <p className="text-purple-700">
          Bli med i husholdningen{" "}
          <span className="font-extrabold text-purple-900">"{invite.households?.name}"</span> som
          co-parent.
        </p>
        <p className="text-xs text-purple-500">
          Du får tilgang til de samme barna, oppgavene og saldoene som de andre voksne i
          husholdningen.
        </p>

        {sessionLoading ? (
          <div className="text-purple-400 py-4">Sjekker innlogging...</div>
        ) : !session ? (
          <div className="space-y-2 pt-2">
            <p className="text-sm text-purple-700 font-semibold">
              Logg inn først (eller lag konto) for å akseptere
            </p>
            <Link
              href={`/auth/signin?redirect=/invite/${token}`}
              className="btn-primary inline-block w-full"
            >
              Logg inn
            </Link>
            <Link
              href={`/auth/signup?redirect=/invite/${token}`}
              className="btn-ghost inline-block w-full"
            >
              Lag konto
            </Link>
          </div>
        ) : (
          <div className="pt-2 space-y-2">
            <div className="text-sm text-purple-700">
              Du er innlogget som <b>{session.user.email}</b>
            </div>
            <button
              onClick={accept}
              disabled={accepting}
              className="btn-primary w-full disabled:opacity-50"
            >
              {accepting ? "Akseptere..." : "Aksepter invitasjon"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
