# 🌟 Ukeslønn

En familieapp for ukeslønn der barna kan krysse av oppgaver, samle penger og XP, og foreldre kan godkjenne, lage oppgaver og gi bonuspremier.

Bygget for Ludvig (7) og Josefine (9). Funker på telefon, iPad og PC.

## ✨ Funksjoner

**For barn:**
- Egen profil med PIN-innlogging og avatar
- Se dagens oppgaver med belønning, ikon og farge
- Trykk på en oppgave for å markere den som ferdig — venter på voksen
- Se saldo, dagens og ukens inntjening
- Samle XP og klatre i nivåer (Hjelper → Magisk Konge)
- Se progresjon mot bonus-premier
- Konfetti og animasjoner når oppgaver fullføres 🎉

**For voksen:**
- Godkjenn eller avvis oppgaver med ett trykk
- Lag, rediger, slett oppgaver (daglig, ukentlig, engangs)
- Tildel oppgaver til bestemt barn eller alle
- Sett opp bonuspremier (X oppgaver/uka, Y kr/måneden, eller manuelle)
- Følg saldoer og progresjon for hvert barn
- Betal ut og nullstill saldo
- Administrer profiler, navn, PIN, avatar

## 🚀 Kom i gang

### 1. Sett opp Supabase (gratis)

1. Gå til [supabase.com](https://supabase.com) og opprett en konto
2. Lag et nytt prosjekt (velg en region nær deg, f.eks. Stockholm/Frankfurt)
3. Vent ~2 minutter mens prosjektet bygges
4. Når det er klart: åpne **SQL Editor** i venstre meny
5. Trykk **+ New query**, lim inn alt innholdet fra `supabase/schema.sql` og kjør (Run/⌘+Enter)

Dette setter opp alle tabellene og legger inn standardprofiler for Mamma/Pappa, Ludvig og Josefine.

### 2. Hent API-nøkler

I Supabase: **Project Settings → API**

Kopier:
- **Project URL** (f.eks. `https://abc123.supabase.co`)
- **anon public** key (lang tekst)

### 3. Konfigurer appen

Lag en fil som heter `.env.local` i prosjektmappen (kopier fra `.env.local.example`) og fyll inn:

```
NEXT_PUBLIC_SUPABASE_URL=https://din-prosjekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key
```

### 4. Start appen

```bash
npm install
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## 🔐 Standard PIN-koder

Endre disse i appen via **Profiler**-siden!

- **Mamma/Pappa**: `1234`
- **Josefine**: `1111`
- **Ludvig**: `2222`

## 🌐 Publisering på nett (valgfritt)

For å bruke appen fra ulike enheter (telefon, iPad, andre PC-er) kan du legge den ut gratis på Vercel:

1. Lag konto på [vercel.com](https://vercel.com)
2. Trykk **Add New → Project**
3. Importer prosjektet (push først til GitHub, eller dra-og-slipp mappen)
4. Sett miljøvariablene `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy! Du får en URL som `https://ukeslonn.vercel.app`

Da kan alle i familien åpne appen i nettleseren og logge inn med sin egen PIN.

**Tips:** Legg URL-en til på hjem-skjermen på iPad/telefonen ("Legg til på Hjem-skjerm" i Safari) så ser det ut og oppfører seg som en ekte app.

## 🎮 XP og nivåer

Hver gang en oppgave godkjennes, får barnet XP basert på belønningen (1 XP per 10 øre, minimum 10 XP).

Nivåene er:
1. 🌱 Hjelper
2. 🪴 Lærling
3. ⭐ Stjernehjelper
4. 🌟 Mester
5. 🦸 Superhelt
6. 🏆 Champion
7. 🐉 Legende
8. 🔥 Drage
9. 🚀 Galakse-helt
10. 👑 Magisk Konge

## 🛠 Teknisk

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4 + custom CSS
- **Animasjon:** Framer Motion + canvas-confetti
- **Database:** Supabase (PostgreSQL)
- **Auth:** Egen PIN-løsning (lagret som tekst i db — fin for familiebruk, ikke produksjon)

## 📝 Tips for foreldre

- Start med 5-8 daglige oppgaver så barna ikke blir overveldet
- Belønningene trenger ikke være store: 5-20 kr per oppgave fungerer fint
- Bruk **Premier** til å motivere til langsiktig innsats:
  - "10 oppgaver denne uka = 50 kr ekstra"
  - "200 kr tjent denne måneden = kino-tur"
  - Manuelle premier ("Tidenes ryddejobb" som du gir når det fortjenes)
- Bruk **Utbetaling** når dere faktisk overfører penger — da nullstilles saldoen i appen
- Hvis et barn glemmer å krysse av: voksen kan ikke godkjenne uten at det er "trykket". Få barnet til å trykke selv så lærer de rutinen.

## 🐛 Problemer?

- **"Setup mangler"-skjerm:** Du har ikke laget `.env.local` enda, eller har glemt å restarte serveren etter å ha laget den
- **Ingen profiler vises:** Har du kjørt `schema.sql` i Supabase SQL Editor?
- **Endringer vises ikke:** Last inn siden på nytt (oppgaver fra én enhet synkroniseres ikke automatisk til en annen — du må refreshe)
