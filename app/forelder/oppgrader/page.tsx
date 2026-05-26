"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

type Billing = "monthly" | "yearly";
type Plan = "family_monthly" | "family_yearly" | "lifetime";

const PRICES = {
  family_monthly: { amount: 49, period: "/mnd", label: "Faktureres månedlig" },
  family_yearly: { amount: 33, period: "/mnd", label: "Faktureres 399 kr per år" },
  lifetime: { amount: 599, period: "", label: "Én betaling, evig tilgang" },
};

export default function OppgraderPage() {
  const [billing, setBilling] = useState<Billing>("yearly");
  const [busyPlan, setBusyPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async (plan: Plan) => {
    setBusyPlan(plan);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setError("Du må være innlogget");
      setBusyPlan(null);
      return;
    }

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      });
      const result = await res.json();
      if (!res.ok || !result.url) {
        throw new Error(result.error ?? "Kunne ikke starte betaling");
      }
      window.location.href = result.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ukjent feil");
      setBusyPlan(null);
    }
  };

  const familyPlan: Plan = billing === "monthly" ? "family_monthly" : "family_yearly";

  return (
    <div className="space-y-6">
      <header className="text-center">
        <div className="text-5xl mb-2">💎</div>
        <h1 className="text-3xl font-extrabold text-purple-900">Oppgrader til Premium</h1>
        <p className="text-purple-600 font-medium mt-1">
          Lås opp alle funksjoner — start 14 dagers gratis prøveperiode
        </p>
      </header>

      {/* Toggle */}
      <div className="flex justify-center">
        <div className="bg-white rounded-full p-1 inline-flex shadow-md">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-5 py-2 rounded-full text-sm font-bold transition ${
              billing === "monthly" ? "bg-purple-600 text-white" : "text-purple-600"
            }`}
          >
            Månedlig
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-5 py-2 rounded-full text-sm font-bold transition relative ${
              billing === "yearly" ? "bg-purple-600 text-white" : "text-purple-600"
            }`}
          >
            Årlig
            <span className="absolute -top-2 -right-3 bg-amber-400 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
              -32%
            </span>
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {/* Familie */}
        <div className="card p-6 ring-4 ring-purple-400 relative flex flex-col">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
            MEST POPULÆR
          </div>
          <div className="text-sm font-bold text-purple-500 uppercase">Familie</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={billing}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <div className="text-3xl font-extrabold text-purple-900 mt-1">
                {PRICES[familyPlan].amount} kr
                <span className="text-base font-medium">{PRICES[familyPlan].period}</span>
              </div>
              <div className="text-sm text-purple-500">{PRICES[familyPlan].label}</div>
            </motion.div>
          </AnimatePresence>
          <ul className="mt-4 space-y-2 text-sm text-purple-700 flex-1">
            <li>✓ <strong>Ubegrenset</strong> barn og oppgaver</li>
            <li>✓ Alle oppgavetyper (intervall, dager etc.)</li>
            <li>✓ Custody-perioder</li>
            <li>✓ Streak-bonus</li>
            <li>✓ Co-parent invite</li>
            <li>✓ Full statistikk og historikk</li>
            <li>✓ 14 dagers gratis prøveperiode uten kort</li>
          </ul>
          <button
            disabled={busyPlan !== null}
            onClick={() => startCheckout(familyPlan)}
            className="btn-primary w-full mt-5 disabled:opacity-50"
          >
            {busyPlan === familyPlan ? "Sender deg til Stripe..." : "Start 14-dagers prøve"}
          </button>
        </div>

        {/* Lifetime */}
        <div className="card p-6 flex flex-col bg-gradient-to-br from-amber-50 to-orange-50 ring-2 ring-amber-300 relative">
          <div className="absolute -top-3 right-4 bg-amber-400 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-full shadow-lg">
            💎 MEST VERDI
          </div>
          <div className="text-sm font-bold text-amber-700 uppercase">Lifetime</div>
          <div className="text-3xl font-extrabold text-purple-900 mt-1">599 kr</div>
          <div className="text-sm text-purple-500">én betaling, evig tilgang</div>
          <ul className="mt-4 space-y-2 text-sm text-purple-700 flex-1">
            <li>✓ <strong>Alt i Familie-pakken</strong></li>
            <li>✓ Ingen abonnement å huske på</li>
            <li>✓ Får alle fremtidige funksjoner</li>
            <li>✓ Tjenes inn på 12-15 mnd</li>
            <li>✓ Støtter en uavhengig norsk app</li>
          </ul>
          <button
            disabled={busyPlan !== null}
            onClick={() => startCheckout("lifetime")}
            className="w-full mt-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold shadow-md disabled:opacity-50"
          >
            {busyPlan === "lifetime" ? "Sender deg til Stripe..." : "Få Lifetime"}
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-md mx-auto bg-red-50 text-red-700 text-sm font-semibold p-3 rounded-xl text-center">
          {error}
        </div>
      )}

      <p className="text-xs text-center text-purple-500">
        Alle priser er inkl. MVA. Du kan bytte plan eller si opp når som helst.
        Betaling håndteres trygt av Stripe (kort, Apple Pay, Vipps).
      </p>
    </div>
  );
}
