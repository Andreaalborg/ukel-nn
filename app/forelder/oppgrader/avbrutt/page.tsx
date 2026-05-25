"use client";

import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="text-7xl">🤔</div>
      <h1 className="text-3xl font-extrabold text-purple-900">Avbrutt</h1>
      <p className="text-purple-600 max-w-md mx-auto">
        Du valgte å avbryte betalingen. Ingen problem — du kan oppgradere når som helst.
        Familien din kan fortsette å bruke gratis-funksjonene.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/forelder" className="btn-primary">
          Tilbake til dashbordet
        </Link>
        <Link href="/forelder/oppgrader" className="btn-ghost">
          Prøv på nytt
        </Link>
      </div>
    </div>
  );
}
