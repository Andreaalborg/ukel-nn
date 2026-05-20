"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Supabase håndterer URL-fragmentet automatisk via detectSessionInUrl.
      // Vent litt og sjekk session.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: members } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", data.session.user.id)
          .limit(1);
        if (members && members.length > 0) {
          router.replace("/");
        } else {
          router.replace("/onboarding");
        }
      } else {
        router.replace("/auth/signin");
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-6xl animate-float">🌟</div>
    </div>
  );
}
