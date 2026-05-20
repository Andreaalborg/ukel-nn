# 🚀 Ukeslønn — Business plan

## Hvor vi er nå (mai 2026)
- Fungerende Next.js + Supabase webapp
- PIN-auth, periodebasert XP, custody-perioder, strekk-bonus, bonus-premier
- Deployet på Netlify/Vercel
- Validering: noen bekjente vil bruke den til sine barn

---

## Fase 0 — Validering (1-2 uker, FØR du investerer tid)

**Mål:** Vit at minst 20-30 foreldre faktisk vil betale for dette.

- [ ] Snakk med 20+ foreldre (venner, FB-grupper, Reddit r/norge)
- [ ] Still spørsmål, ikke selg: "Hvordan løser dere lommepenger/ukeslønn i dag? Hva er irriterende?"
- [ ] Vis dem en 30-sekunders demo og spør: "Ville du betalt 49 kr/mnd for dette?"
- [ ] Lag en enkel landingsside (Carrd, Framer eller egen) med e-post-venteliste
- [ ] Mål: 50+ påmeldinger før du går videre

**Avbrytsregel:** Hvis under 20% sier "ja, ville betalt" — stopp og finn ut hvorfor.

---

## Fase 1 — Multi-tenant infrastruktur (2-3 uker)

Akkurat nå er det én familie = én Supabase-database. For å skalere må vi:

- [ ] Legge til `households`-tabell (hver familie får en ID)
- [ ] Alle eksisterende tabeller får `household_id`
- [ ] **Ekte Supabase Auth** med magic-link eller e-post + passord for foreldre
- [ ] Voksen-rollen håndterer Supabase-auth, barna fortsetter med PIN per husholdning
- [ ] Row Level Security (RLS) som faktisk filtrerer på `household_id`
- [ ] Onboarding-flyt: ny bruker → opprett husholdning → legg til barn

---

## Fase 2 — Betaling og abonnement (1-2 uker)

**Prismodell (forslag):**
- **Gratis:** 1 barn, opp til 5 oppgaver, ingen perioder/strekk-bonus
- **Familie 49 kr/mnd** (eller 399 kr/år = 33 kr/mnd): ubegrenset barn, alle funksjoner, premium-temaer, eksport
- **Familie+ 99 kr/mnd** (senere): integrasjon med Vipps/sparekonto, månedsrapport til besteforeldre, etc.

**Verktøy:**
- [ ] **Stripe** (eller Lemon Squeezy hvis du vil unngå MVA-administrasjon)
- [ ] Trial: 14 dager gratis, ingen kort kreves
- [ ] Webhook → oppdater `households.plan` ved betaling

**Kostnader å huske på:**
- Stripe: 1.4% + 1.80 kr per betaling i Europa
- MVA: må håndtere norsk MVA (Stripe Tax løser det automatisk)
- Lemon Squeezy: 5% + $0.50 — dyrere men de håndterer all MVA selv (Merchant of Record)

**Min anbefaling:** Start med **Lemon Squeezy** — mindre admin, du fokuserer på produkt.

---

## Fase 3 — iOS via Capacitor (2-3 uker)

Du trenger IKKE å bygge appen på nytt i Swift/React Native. **Capacitor** wrapper Next.js-appen som en ekte iOS-app.

**Steg:**
- [ ] `npx create-capacitor-app`
- [ ] Wrap webappen som native shell
- [ ] Legg til native features: push-varslinger, biometrisk PIN-erstatning, ikon, splash screen
- [ ] Test grundig på faktisk iPad og iPhone
- [ ] Apple Developer-konto ($99/år)
- [ ] App Store-pakking: ikon, skjermbilder, beskrivelse, privacy nutrition labels
- [ ] Send inn til review (typisk 1-3 dagers ventetid)

**Android:** Samme Capacitor-bygg → Google Play ($25 engangsavgift). Anbefales å lansere samtidig.

---

## Fase 4 — Juridisk og GDPR (parallelt med Fase 1-3)

Du håndterer barns data. Dette må være på plass:

- [ ] **Personvernerklæring** (GDPR + spesielt for barn under 13)
- [ ] **Brukervilkår**
- [ ] **Cookie-banner** (hvis du bruker analytics)
- [ ] **Databehandleravtale** med Supabase (de har en på supabase.com/legal)
- [ ] Velg EU-region i Supabase (du har sikkert allerede, men dobbeltsjekk)
- [ ] Sletteflyt — bruker skal kunne slette all data
- [ ] Eksportflyt — bruker skal kunne laste ned data

**Verktøy:** [Lawly.no](https://lawly.no) eller [iubenda.com](https://iubenda.com) genererer juridisk-OK dokumenter for ~500-1000 kr.

---

## Fase 5 — Lansering (4-6 uker pre-launch + launch-uke)

### Pre-launch (4-6 uker før)

- [ ] **Landingsside** med video/GIF, prising og waitlist
- [ ] **Instagram + TikTok** — bygg opp 3-5 organiske innlegg/uke. Tema:
  - "Hvordan vi løste ukeslønn-bråket"
  - "Custody-løsning for skilte foreldre"
  - "Get-ready-with-me som forelder mens jeg setter opp ukeslønn"
- [ ] **Snakk med influencere:** norske barnefamilie-kontoer (10k-100k følgere). En partnerpost = ~3-10k NOK eller gratis-tilgang
- [ ] **Beta-test** med 20-50 familier (de du har snakket med + venteliste)
- [ ] Samle vitnesbyrd og skjermbilder fra beta

### Launch-uke

- [ ] **Product Hunt**-lansering (mandagen)
- [ ] **Reddit:** r/norge, r/Norway, r/Parenting med ÆRLIG launch-post ("Jeg bygde dette fordi...")
- [ ] **Facebook-grupper:** "Bonusforeldre", "Mammanett", "Norske foreldre"
- [ ] **PR:** send pressemelding til VG Familie, Foreldre & Barn, Mamma.no. Vinkel: "Norsk app løser samværsforeldres lommepenge-floke"
- [ ] **App Store SEO:** norsk + nordisk søkeord
- [ ] **Referral-program:** gi 1 mnd gratis for hver venn som registrerer

### Etter launch

- [ ] Daglig sjekk av app store reviews, svar på ALLE
- [ ] Ukentlige tall: signups, conversion til betalende, churn
- [ ] Crisp eller Intercom for live-chat support (gratis-tier finnes)

---

## Fase 6 — Vekst (kontinuerlig)

**Funksjoner som kan løfte verdien (etter launch):**
- Familie-rapporter til besteforeldre (kan løse forklaringsproblemet "hva har Ludvig drevet med?")
- Sparemål med visuelle bilder ("ny sykkel = 1200 kr")
- Vipps-integrasjon: ekte overføring fra forelder til barn
- "Klassemodus" for SFO/skoler (B2B-vinkel)
- Foreldre-til-foreldre-deling (samværsforeldre kan begge være med i samme app)
- Apple Watch — fullføre oppgaver fra klokka
- AI-forslag: "basert på alder X, prøv disse oppgavene"

**Mål milepæler:**
- 100 betalende familier = ca 49 000 NOK MRR (≈ deltids-frilanslønn)
- 1000 betalende familier = ca 490 000 NOK MRR (≈ heltidsinntekt)
- 10 000 betalende familier = potensial for å selge eller skalere selskap

---

## 💰 Realistisk økonomi første år

**Inntekter (optimistisk scenario):**
- Måned 1-3: ~50 betalende = 2 450 kr/mnd
- Måned 4-6: ~200 = 9 800 kr/mnd
- Måned 7-12: ~500 = 24 500 kr/mnd
- År 1 total: ~150 000 NOK

**Utgifter første år:**
- Supabase Pro: ~$25-50/mnd × 12 = ~3 000-6 000 NOK
- Vercel Pro: $20/mnd × 12 = ~2 400 NOK
- Apple Developer: $99 = ~1 100 NOK
- Google Play: $25 (engangs) = ~270 NOK
- Domene: ~200 NOK
- Juridisk-mal: ~1 000 NOK
- Influencer-marketing: ~10 000-30 000 NOK
- Stripe-fees (3% av inntekt): ~4 500 NOK
- **Sum:** ~25 000-50 000 NOK

**Realistisk år 1:** Hvis du treffer middels = ~100k profitt + læring + mulig vekst

---

## 🚨 Risikofaktorer

1. **Bankene:** Hvis DNB eller Sparebank slipper en god familie-app gratis, blir det vanskelig
2. **Sesongbasert:** Familier installerer i januar (nyttårsforsetter) og august (skolestart) — mellom de kan signups dø
3. **Churn:** Familier prøver i 1-2 mnd, så detter unna. Få churn under 5%/mnd er kritisk
4. **App Store-avvisning:** Vær ekstra nøye med privacy labels for barn
5. **Ditt eget bandwidth:** Du har full jobb og to barn. Sett 5-10 t/uke som realistisk grense

---

## 🎯 Hva gjør vi først?

Min anbefaling — i denne rekkefølgen:

1. **Først:** Fase 0 (validering) — 2 uker, lavt risikabelt
2. **Hvis validering OK:** Lag landingsside + e-post-venteliste (1 uke)
3. **Bygg parallelt** med fase 1 (multi-tenant) mens du markedsfører
4. **Beta-launch** med venteliste etter 4-6 uker
5. **Public launch** 8-12 uker fra nå

Si fra om hvilken del du vil ta fatt i først — jeg kan hjelpe med koden for multi-tenant, designe landingsside, skrive launch-strategi, eller noe annet.
