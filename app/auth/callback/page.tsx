"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/auth/signin");
        return;
      }

      // 1) Allerede medlem av en husholdning?
      const { data: members } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", data.session.user.id)
        .limit(1);
      if (members && members.length > 0) {
        router.replace("/");
        return;
      }

      // 2) Eksisterer det husholdninger uten medlemmer som kan claimes?
      const { data: orphans } = await supabase.rpc("list_orphan_households");
      if (orphans && (orphans as unknown[]).length > 0) {
        router.replace("/claim");
        return;
      }

      // 3) Ellers gå til onboarding
      router.replace("/onboarding");
    })();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-6xl animate-float">🌟</div>
    </div>
  );
}
