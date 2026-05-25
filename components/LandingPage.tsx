"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import LegalFooter from "@/components/LegalFooter";

type Billing = "monthly" | "yearly";

export default function LandingPage() {
  const [billing, setBilling] = useState<Billing>("yearly");
  const familyMonthlyPrice = 49;
  const familyYearlyPrice = 399;
  const familyYearlyAsMonthly = (familyYearlyPrice / 12).toFixed(0);
  const savingsPct = Math.round(
    100 - (familyYearlyPrice / (familyMonthlyPrice * 12)) * 100
  );

  return (
    <div className="min-h-screen">
      {/* Beta-banner øverst */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center text-xs sm:text-sm font-semibold py-2 px-4">
        🚀 Vi er i tidlig beta — bli en av de første familiene! Gratis å prøve.
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌟</span>
            <span className="font-extrabold text-purple-900 text-xl">Gjøre</span>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase">
              Beta
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/auth/signin"
              className="text-purple-700 font-semibold text-sm px-3 py-1.5"
            >
              Logg inn
            </Link>
            <Link href="/auth/signup" className="btn-primary text-sm px-4 py-2">
              Kom i gang
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 sm:px-6 pt-12 pb-20 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full mb-4">
            👶 LAGET FOR FAMILIER MED BARN 4-12 ÅR
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-purple-900 leading-tight">
            Ukeslønn som faktisk{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              motiverer
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-purple-700 mt-6 leading-relaxed">
            Forvandle hverdagsoppgaver til en lek. Barna samler stjerner, klatrer i nivåer
            og lærer at innsats lønner seg. Du som forelder slipper å mase.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href="/auth/signup" className="btn-primary text-base px-6 py-3">
              Start gratis i 14 dager →
            </Link>
            <Link href="#hvordan" className="btn-ghost text-base px-6 py-3">
              Se hvordan det funker
            </Link>
          </div>
          <p className="text-xs text-purple-500 mt-4">
            Ingen kortinformasjon kreves · Avbryt når du vil
          </p>

          {/* App Store / Play Store badges — kommer snart */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-xs font-bold text-purple-500 uppercase tracking-wider">
              Native app kommer snart
            </p>
            <div className="flex flex-wrap justify-center items-center gap-3">
              <div className="relative group cursor-not-allowed" aria-label="App Store — kommer snart">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/app-store-badge.svg"
                  alt="Kommer snart i App Store"
                  className="h-12 opacity-60 grayscale group-hover:opacity-80 transition"
                />
                <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
                  SNART
                </div>
              </div>
              <div className="relative group cursor-not-allowed" aria-label="Google Play — kommer snart">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/google-play-badge.svg"
                  alt="Kommer snart i Google Play"
                  className="h-12 opacity-60 grayscale group-hover:opacity-80 transition"
                />
                <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
                  SNART
                </div>
              </div>
            </div>
            <p className="text-[11px] text-purple-400">
              Frem til da: webappen funker på alle enheter — legg den til på
              hjem-skjermen for app-følelse
            </p>
          </div>
        </div>

        {/* Phone mockup */}
        <PhoneMockup />
      </section>

      {/* Hvordan det funker */}
      <section id="hvordan" className="px-4 sm:px-6 py-16 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-purple-900 mb-3">
            Slik funker det
          </h2>
          <p className="text-center text-purple-600 mb-12">
            Tre enkle steg fra installasjon til fornøyde barn
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                num: "1",
                emoji: "📝",
                title: "Lag oppgavene",
                desc: "Du som forelder bestemmer hva som skal gjøres og hvor mye det er verdt. Daglige, ukentlige eller egendefinerte rutiner.",
              },
              {
                num: "2",
                emoji: "✨",
                title: "Barna krysser av",
                desc: "Med egen PIN og morsom avatar krysser barna av oppgaver de har gjort. Konfetti og animasjoner gjør det gøy.",
              },
              {
                num: "3",
                emoji: "✅",
                title: "Du godkjenner",
                desc: "Med ett trykk godkjenner du oppgaven. Barnet får penger på saldo og XP til nivået sitt. Du betaler ut når det passer.",
              },
            ].map((step) => (
              <div key={step.num} className="card p-6 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-br from-purple-600 to-pink-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-extrabold shadow-lg">
                  {step.num}
                </div>
                <div className="text-5xl mb-3 mt-2">{step.emoji}</div>
                <h3 className="text-xl font-extrabold text-purple-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-purple-700 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funksjoner */}
      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-purple-900 mb-3">
            Bygget for norske familier
          </h2>
          <p className="text-center text-purple-600 mb-12">
            Med alt vi savnet i konkurrentene
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: "🏆",
                title: "Premier og strekk-bonus",
                desc: "Sett ukentlige og månedlige bonuspremier. Når barnet når Level 10 flere perioder på rad, åpnes ekstra belønninger.",
              },
              {
                icon: "📅",
                title: "Custody-perioder",
                desc: "Bor barna annenhver uke? Definer besøksperioder så regnes XP og bonuser per besøk i stedet for kalenderuke.",
              },
              {
                icon: "👫",
                title: "Del med begge foreldre",
                desc: "Inviter samværsforelderen. Begge ser samme barn, oppgaver og saldo. Eller hold familier separat — du bestemmer.",
              },
              {
                icon: "🎮",
                title: "Lekent og motiverende",
                desc: "10 nivåer fra Hjelper til Magisk Konge. Konfetti, animasjoner og fargerike kort som faktisk får barna til å smile.",
              },
              {
                icon: "💰",
                title: "Virtuelt + ekte penger",
                desc: "Saldoen er virtuell. Når du betaler ut på ekte, nullstilles bare den. Du har full kontroll på hvor mye og hvor ofte.",
              },
              {
                icon: "🔒",
                title: "Norsk og trygt",
                desc: "Data lagres i EU. GDPR-compliant. Vi selger ikke data. Ingen reklame. Ingen tracking av barn.",
              },
            ].map((f) => (
              <div key={f.title} className="card p-5 flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">{f.icon}</div>
                <div>
                  <h3 className="font-extrabold text-purple-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-purple-700">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pris */}
      <section
        id="pris"
        className="px-4 sm:px-6 py-16 bg-gradient-to-br from-purple-100 to-pink-100"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-purple-900 mb-3">
            Enkel pris
          </h2>
          <p className="text-center text-purple-600 mb-8">
            Start gratis. Oppgrader når familien vil ha mer.
          </p>

          {/* Toggle månedlig/årlig */}
          <div className="flex justify-center mb-10">
            <div className="bg-white rounded-full p-1 inline-flex shadow-md">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-bold transition ${
                  billing === "monthly"
                    ? "bg-purple-600 text-white"
                    : "text-purple-600"
                }`}
              >
                Månedlig
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`px-5 py-2 rounded-full text-sm font-bold transition relative ${
                  billing === "yearly"
                    ? "bg-purple-600 text-white"
                    : "text-purple-600"
                }`}
              >
                Årlig
                <span className="absolute -top-2 -right-3 bg-amber-400 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                  -{savingsPct}%
                </span>
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Gratis */}
            <div className="card p-6 flex flex-col">
              <div className="text-sm font-bold text-purple-500 uppercase">Gratis</div>
              <div className="text-3xl font-extrabold text-purple-900 mt-1">0 kr</div>
              <div className="text-sm text-purple-500">for alltid</div>
              <ul className="mt-4 space-y-2 text-sm text-purple-700 flex-1">
                <li>✓ 1 barn</li>
                <li>✓ Opptil 10 oppgaver</li>
                <li>✓ Daglig + ukentlig hyppighet</li>
                <li>✓ Basic statistikk</li>
                <li className="text-purple-400">✗ Custody-perioder</li>
                <li className="text-purple-400">✗ Strekk-bonus</li>
                <li className="text-purple-400">✗ Co-parent invite</li>
              </ul>
              <Link
                href="/auth/signup"
                className="btn-ghost w-full mt-5 block text-center"
              >
                Start gratis
              </Link>
            </div>

            {/* Familie — månedlig/årlig */}
            <div className="card p-6 ring-4 ring-purple-400 relative flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                MEST POPULÆR
              </div>
              <div className="text-sm font-bold text-purple-500 uppercase">Familie</div>
              <AnimatePresence mode="wait">
                {billing === "monthly" ? (
                  <motion.div
                    key="m"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    <div className="text-3xl font-extrabold text-purple-900 mt-1">
                      {familyMonthlyPrice} kr
                      <span className="text-base font-medium">/mnd</span>
                    </div>
                    <div className="text-sm text-purple-500">Faktureres månedlig</div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="y"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    <div className="text-3xl font-extrabold text-purple-900 mt-1">
                      {familyYearlyAsMonthly} kr
                      <span className="text-base font-medium">/mnd</span>
                    </div>
                    <div className="text-sm text-purple-500">
                      Faktureres {familyYearlyPrice} kr per år · spar {savingsPct}%
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <ul className="mt-4 space-y-2 text-sm text-purple-700 flex-1">
                <li>✓ <strong>Ubegrenset</strong> barn og oppgaver</li>
                <li>✓ Alle oppgavetyper (intervall, dager etc.)</li>
                <li>✓ Custody-perioder</li>
                <li>✓ Strekk-bonus</li>
                <li>✓ Co-parent invite</li>
                <li>✓ Full statistikk og historikk</li>
                <li>✓ 14 dagers gratis prøve uten kort</li>
              </ul>
              <Link
                href="/auth/signup"
                className="btn-primary w-full mt-5 block text-center"
              >
                Start 14-dagers prøve
              </Link>
            </div>

            {/* Lifetime */}
            <div className="card p-6 flex flex-col bg-gradient-to-br from-amber-50 to-orange-50 ring-2 ring-amber-300 relative">
              <div className="absolute -top-3 right-4 bg-amber-400 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-full shadow-lg">
                💎 BESTE VERDI
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
              <Link
                href="/auth/signup"
                className="w-full mt-5 block text-center py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold shadow-md hover:scale-[1.02] transition"
              >
                Få Lifetime
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-purple-500 mt-6">
            Alle priser er inkl. MVA. Du kan bytte plan eller si opp når som helst.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-purple-900 mb-10">
            Spørsmål du kanskje har
          </h2>
          <div className="space-y-3">
            {[
              {
                q: "Krever appen at barna har eget kort eller bank?",
                a: "Nei. Saldoen er virtuell. Du betaler ut ekte penger til barnet når du vil (kontant, Vipps, sparekonto — uansett hva som passer dere).",
              },
              {
                q: "Hva med samværsforeldre / delt omsorg?",
                a: "Appen er bygget med dette i tankene. Du kan invitere den andre forelderen som co-parent, eller hver av dere kan ha egen familie i appen. Custody-perioder lar dere spore oppgaver per besøk.",
              },
              {
                q: "Hvor gamle bør barna være?",
                a: "Appen passer fra 4 år (med hjelp fra forelder for å lese) og oppover. Eldre barn (8-12) klarer mest selv. Det enkle grensesnittet er designet for at små barn skal kunne bruke det.",
              },
              {
                q: "Lifetime — er det virkelig 'evig'?",
                a: "Ja, så lenge tjenesten eksisterer beholder du Familie-tilgangen din uten ekstra betaling. Skulle vi måtte stoppe tjenesten, gir vi minst 60 dagers varsel og full datas-eksport.",
              },
              {
                q: "Hva skjer hvis jeg sier opp?",
                a: "Du beholder tilgang ut perioden du har betalt for. Du kan eksportere all data som JSON før kontoen slettes. Sletter du kontoen, fjernes alt umiddelbart i tråd med GDPR.",
              },
              {
                q: "Lagrer dere data om barna?",
                a: "Vi lagrer det som trengs: navn (du velger om det er fornavn eller kallenavn), eventuell fødselsdato, aktivitet i appen. Vi selger ALDRI data og bruker INGEN tredjeparts annonseverktøy. Data lagres i EU.",
              },
              {
                q: "Funker det på iPhone / iPad / PC?",
                a: "Ja, det er en webapp som funker overalt akkurat nå. Du kan legge den til på hjemskjermen på telefonen for å bruke den som en vanlig app. Native iOS- og Android-app kommer i App Store og Google Play så snart vi har validert produktet med våre første brukere.",
              },
              {
                q: "Hva betyr 'tidlig beta'?",
                a: "Vi er i aktiv utvikling og legger til nye funksjoner hver uke basert på tilbakemeldinger fra brukerne våre. Som tidlig bruker får du være med og forme appen — og du betaler ingenting før vi går ut av beta.",
              },
            ].map((f) => (
              <details key={f.q} className="card p-4 group">
                <summary className="cursor-pointer font-bold text-purple-900 list-none flex items-center justify-between">
                  {f.q}
                  <span className="text-purple-400 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <p className="text-purple-700 text-sm mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bunn */}
      <section className="px-4 sm:px-6 py-16 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Klar til å gjøre hverdagen lettere?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Bli med familier som allerede har gjort det.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-white text-purple-900 font-extrabold px-8 py-4 rounded-full shadow-2xl hover:scale-105 transition-transform"
          >
            Lag konto gratis →
          </Link>
          <p className="text-sm opacity-80 mt-4">
            Krever ikke kortinformasjon · Avbryt når du vil
          </p>
        </div>
      </section>

      <LegalFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Telefon-mockup                                                      */
/* ------------------------------------------------------------------ */

function PhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className="mt-16 flex justify-center items-end gap-4 sm:gap-8 flex-wrap"
    >
      {/* Telefon */}
      <div className="relative">
        <div className="w-72 sm:w-80 bg-slate-900 rounded-[2.5rem] shadow-2xl p-2 pb-4">
          {/* Skjerm */}
          <div className="bg-white rounded-[2rem] overflow-hidden">
            {/* Notch */}
            <div className="bg-slate-900 h-6 flex justify-center items-center">
              <div className="w-16 h-4 bg-slate-900 rounded-b-2xl" />
            </div>
            {/* Header */}
            <div
              className="px-4 py-5 text-white"
              style={{
                background: "linear-gradient(135deg, #FFD93D, #EC4899 100%)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-white/80 text-[10px] font-semibold bg-white/20 backdrop-blur px-2 py-1 rounded-full">
                  ← Bytt
                </div>
                <div className="text-right">
                  <div className="text-[10px] opacity-80 font-medium">Saldo</div>
                  <div className="text-xl font-extrabold">42 kr</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center text-2xl ring-2 ring-white/50">
                  🦊
                </div>
                <div>
                  <div className="text-[10px] opacity-80">Hei!</div>
                  <div className="text-lg font-extrabold leading-tight">Lilja</div>
                </div>
              </div>
              {/* XP-bar */}
              <div className="bg-white/20 backdrop-blur rounded-xl p-2">
                <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                  <span>🦸 Nivå 5 · Superhelt</span>
                  <span className="opacity-80">130/180 XP</span>
                </div>
                <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "72%",
                      background: "linear-gradient(90deg, #FFD93D, #fff)",
                    }}
                  />
                </div>
              </div>
            </div>
            {/* Oppgaver */}
            <div className="p-3 space-y-2 bg-purple-50">
              <div className="text-[10px] font-extrabold text-purple-900 mb-1">
                🎯 OPPGAVER I DAG
              </div>
              {[
                { icon: "🛏️", title: "Re seng", value: 5, color: "#FFD93D" },
                { icon: "🪥", title: "Pusse tenner", value: 5, color: "#06B6D4" },
                { icon: "📚", title: "Lekser", value: 10, color: "#F59E0B" },
                { icon: "🧹", title: "Rydde rommet", value: 15, color: "#A78BFA" },
              ].map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="bg-white rounded-xl p-2 flex items-center gap-2 shadow-sm"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${t.color}33` }}
                  >
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-extrabold text-purple-900 truncate">
                      {t.title}
                    </div>
                    <div className="text-[9px] text-purple-400">Hver dag</div>
                  </div>
                  <div className="text-amber-600 font-extrabold text-sm">
                    {t.value} kr
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        {/* Floating bubble */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1, type: "spring" }}
          className="absolute -top-3 -right-3 bg-amber-400 text-amber-900 font-extrabold px-3 py-1.5 rounded-full shadow-lg text-sm"
        >
          🎉 Bra jobba!
        </motion.div>
      </div>

      {/* Voksen-godkjenningskort — vises på desktop, gjemmes på mobil */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="hidden lg:block w-72"
      >
        <div className="card p-4 shadow-xl">
          <div className="text-xs font-bold text-purple-500 uppercase mb-2">
            👑 Du som forelder
          </div>
          <div className="text-sm font-extrabold text-purple-900 mb-3">
            ✋ Venter på godkjenning
          </div>
          <div className="space-y-2">
            {[
              { icon: "🛏️", title: "Lilja re-de senga", value: 5 },
              { icon: "📚", title: "Theo gjorde lekser", value: 10 },
            ].map((p, i) => (
              <div
                key={i}
                className="bg-purple-50 rounded-xl p-2 flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-lg">
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-purple-900 truncate">
                    {p.title}
                  </div>
                  <div className="text-[10px] text-amber-600">{p.value} kr</div>
                </div>
                <button className="w-7 h-7 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                  ✕
                </button>
                <button className="w-7 h-7 rounded-full bg-green-500 text-white text-xs font-bold shadow">
                  ✓
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 bg-amber-50 rounded-xl p-2 text-[10px] font-semibold text-amber-900 flex items-center gap-1.5">
            🔥 <span>Lilja har 2 perioder på rad med Level 10!</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
