"use client";

import Link from "next/link";
import { usePremium } from "@/lib/usePremium";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Vis full-side låst tilstand (med beskrivelse) hvis ikke Premium */
  feature?: string;
  description?: string;
};

/** Wrapper som viser children kun hvis Premium, ellers fallback. */
export default function PremiumGate({ children, fallback, feature, description }: Props) {
  const { isPremium, loading } = usePremium();
  if (loading) {
    return (
      <div className="text-center py-12 text-4xl animate-float">⏳</div>
    );
  }
  if (!isPremium) {
    return fallback ?? <PremiumLockedFullPage feature={feature} description={description} />;
  }
  return <>{children}</>;
}

/** Full-side låst tilstand */
export function PremiumLockedFullPage({
  feature,
  description,
}: {
  feature?: string;
  description?: string;
}) {
  return (
    <div className="max-w-lg mx-auto card p-6 sm:p-8 text-center my-8">
      <div className="text-6xl mb-3">💎</div>
      <div className="inline-block bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full uppercase mb-3">
        Premium-funksjon
      </div>
      <h1 className="text-2xl font-extrabold text-purple-900 mb-2">
        {feature ?? "Denne funksjonen krever Premium"}
      </h1>
      <p className="text-purple-700 mb-5">
        {description ??
          "Oppgrader for å låse opp denne og alle andre Premium-funksjoner. Start gratis i 14 dager."}
      </p>
      <Link href="/forelder/oppgrader" className="btn-primary inline-block">
        💎 Se planer
      </Link>
    </div>
  );
}

/** Mindre låst-overlegg for f.eks. enkeltknapper */
export function PremiumLockBadge({ label = "Premium" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full">
      💎 {label}
    </span>
  );
}

/** Liten oppgrader-CTA-boks */
export function UpgradePrompt({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="card p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
      <div className="flex items-start gap-3">
        <div className="text-3xl flex-shrink-0">💎</div>
        <div className="flex-1">
          <div className="font-extrabold text-purple-900 text-sm">{title}</div>
          <div className="text-xs text-purple-700 mt-0.5">{message}</div>
          <Link
            href="/forelder/oppgrader"
            className="inline-block mt-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full"
          >
            Oppgrader →
          </Link>
        </div>
      </div>
    </div>
  );
}
