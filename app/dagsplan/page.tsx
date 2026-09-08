"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import { getActiveProfile } from "@/lib/auth";
import DagsplanView from "@/components/DagsplanView";
import SetupNotice from "@/components/SetupNotice";

/**
 * Frittstående inngang til familiekalenderen — brukes av barn og på
 * delte "kiosk"-enheter (f.eks. en iPad på kjøkkenet) der ingen
 * bestemt PIN-profil er valgt. Ingen sidemeny her.
 *
 * Voksne sendes videre til /forelder/dagsplan, som er nøstet under
 * forelder/layout.tsx og dermed får den vanlige, flytende
 * sidemeny-navigasjonen (ingen full remount ved sidebytte).
 */
export default function DagsplanEntryPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || sessionLoading || !session) return;
    if (getActiveProfile()?.role === "parent") {
      setRedirecting(true);
      router.replace("/forelder/dagsplan");
    }
  }, [session, sessionLoading, router]);

  if (!isSupabaseConfigured) return <SetupNotice />;

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center text-6xl animate-float">
        📅
      </div>
    );
  }

  return <DagsplanView />;
}
