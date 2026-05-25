"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import LegalFooter from "@/components/LegalFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌟</span>
            <span className="font-extrabold text-purple-900 text-xl">Gjøre</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/auth/signin" className="text-purple-700 font-semibold text-sm px-3 py-1.5">
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
            <Link
              href="#hvordan"
              className="btn-ghost text-base px-6 py-3"
            >
              Se hvordan det funker
            </Link>
          </div>
          <p className="text-xs text-purple-500 mt-4">
            Ingen kortinformasjon kreves · Avbryt når du vil
          </p>
        </div>

        {/* Floating phone mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mt-16 flex justify-center"
        >
          <div className="relative">
            <div className="w-72 sm:w-80 bg-white rounded-[2rem] shadow-2xl p-4 border-8 border-purple-900">
              <div
                className="rounded-3xl p-5 text-white"
                style={{
                  background: "linear-gradient(135deg, #EC4899, #8b5cf6 100%)",
                }}
              >
                <div className="text-xs opacity-80">Hei!</div>
                <div className="text-2xl font-extrabold mb-2">Josefine 🦄</div>
                <div className="bg-white/20 backdrop-blur rounded-xl p-2 text-xs">
                  <div className="flex items-center gap-1 font-bold">
                    🦸 Nivå 5 · Superhelt
                  </div>
                  <div className="h-2 bg-white/30 rounded-full overflow-hidden mt-1">
                    <div className="h-full w-3/4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                {[
                  { icon: "🛏️", title: "Re seng", value: 5 },
                  { icon: "🪥", title: "Pusse tenner", value: 5 },
                  { icon: "📚", title: "Lekser", value: 10 },
                ].map((t, i) => (
                  <div
                    key={i}
                    className="card p-2 flex items-center gap-2 text-purple-900"
                  >
                    <div className="text-2xl">{t.icon}</div>
                    <div className="text-xs font-bold flex-1">{t.title}</div>
                    <div className="text-amber-600 font-extrabold text-sm">
                      {t.value} kr
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -top-3 -right-3 bg-amber-400 text-amber-900 font-bold px-3 py-1 rounded-full shadow text-sm animate-bounce">
              🎉 Sterkt!
            </div>
          </div>
        </motion.div>
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
      <section id="pris" className="px-4 sm:px-6 py-16 bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-purple-900 mb-3">
            Enkel pris
          </h2>
          <p className="text-center text-purple-600 mb-10">
            Start gratis. Oppgrader når familien vil ha mer.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Gratis */}
            <div className="card p-6">
              <div className="text-sm font-bold text-purple-500 uppercase">Gratis</div>
              <div className="text-3xl font-extrabold text-purple-900 mt-1">0 kr</div>
              <div className="text-sm text-purple-500">for alltid</div>
              <ul className="mt-4 space-y-2 text-sm text-purple-700">
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

            {/* Familie */}
            <div className="card p-6 ring-4 ring-purple-400 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                MEST POPULÆR
              </div>
              <div className="text-sm font-bold text-purple-500 uppercase">Familie</div>
              <div className="text-3xl font-extrabold text-purple-900 mt-1">
                49 kr<span className="text-base font-medium">/mnd</span>
              </div>
              <div className="text-sm text-purple-500">eller 399 kr/år (spar 17%)</div>
              <ul className="mt-4 space-y-2 text-sm text-purple-700">
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
          </div>
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
                q: "Hva skjer hvis jeg sier opp?",
                a: "Du beholder tilgang ut perioden du har betalt for. Du kan eksportere all data som JSON før kontoen slettes. Sletter du kontoen, fjernes alt umiddelbart i tråd med GDPR.",
              },
              {
                q: "Lagrer dere data om barna?",
                a: "Vi lagrer det som trengs: navn (du velger om det er fornavn eller kallenavn), eventuell fødselsdato, aktivitet i appen. Vi selger ALDRI data og bruker INGEN tredjeparts annonseverktøy. Data lagres i EU.",
              },
              {
                q: "Funker det på iPhone / iPad / PC?",
                a: "Ja, det er en webapp som funker overalt. Du kan legge den til på hjemskjermen på telefonen for å bruke den som en vanlig app. Native iOS- og Android-app kommer senere.",
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
