"use client";

import Link from "next/link";
import { celebrate } from "@/components/Celebrate";
import { useEffect } from "react";

export default function SuccessPage() {
  useEffect(() => {
    const t = setTimeout(() => celebrate("big"), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6 text-center">
      <div className="text-7xl animate-float">🎉</div>
      <h1 className="text-3xl font-extrabold text-purple-900">Velkommen til Premium!</h1>
      <p className="text-purple-600 max-w-md mx-auto">
        Takk for at du tar i bruk Gjøre. Alle Premium-funksjoner er nå låst opp for familien
        din. Du kan se og endre abonnementet ditt under <strong>Innstillinger</strong>.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/forelder" className="btn-primary">
          Til dashbordet →
        </Link>
        <Link href="/forelder/innstillinger" className="btn-ghost">
          Se abonnement
        </Link>
      </div>
      <p className="text-xs text-purple-400 pt-6">
        Det kan ta noen sekunder før Premium-statusen vises. Last siden på nytt om den ikke
        oppdateres umiddelbart.
      </p>
    </div>
  );
}
