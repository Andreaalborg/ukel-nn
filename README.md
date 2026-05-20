# 🌟 Ukeslønn

En familieapp for ukeslønn der barna kan krysse av oppgaver, samle penger og XP, og foreldre kan godkjenne, lage oppgaver og gi bonuspremier.

Bygget for Ludvig (7) og Josefine (9). Funker på telefon, iPad og PC.

## ✨ Funksjoner

**For barn:**
- Egen profil med PIN-innlogging og avatar
- Se dagens oppgaver med belønning, ikon og farge
- Trykk på en oppgave for å markere den som ferdig — venter på voksen
- Se saldo, dagens og periodens inntjening
- Samle XP og klatre i nivåer 1-10 (Hjelper → Magisk Konge) — **nullstilles hver periode**
- Trykk på XP-baren for å se alle 10 nivåer og hvor mye som gjenstår til Level 10
- Se progresjon mot bonus-premier og strekk-bonuser 🔥
- Konfetti og animasjoner når oppgaver fullføres 🎉

**For voksen:**
- Godkjenn eller avvis oppgaver med ett trykk
- Lag, rediger, slett oppgaver med fleksibel hyppighet:
  - Hver dag
  - Valgte ukedager (f.eks. bare hverdager eller bare helger)
  - Hver N. dag (annenhver dag osv.)
  - Engangs eller ukentlig
  - Med valgfri start- og slutt-dato
- Sett egen XP-verdi per oppgave (default 10 XP)
- **Custody-perioder:** registrer datoer barna er hos deg (f.eks. fre→ons = 13 dager). XP og bonuser regnes per periode i stedet for kalenderuke.
- Sett opp bonuspremier (X oppgaver/perioden, Y kr/uka, eller manuelle)
- **Strekk-bonuser:** Premier for å nå Level 10 i flere perioder på rad
- Følg saldoer, periodebasert XP og strekk for hvert barn
- Betal ut og nullstill saldo
- Administrer profiler, navn, PIN, avatar

## 🚀 Kom i gang

### 1. Sett opp Supabase (gratis)

1. Gå til [supabase.com](https://supabase.com) og opprett en konto
2. Lag et nytt prosjekt (velg en region nær deg, f.eks. Stockholm/Frankfurt)
3. Vent ~2 minutter mens prosjektet bygges
4. Når det er klart: åpne **SQL Editor** i venstre meny
5. Trykk **+ New query**, lim inn alt innholdet fra `supabase/schema.sql` og kjør (Run/⌘+Enter)
6. **Hvis du oppgraderer fra v1**: kjør også `supabase/migration_v2.sql`.
7. **Hvis du oppgraderer fra v2 til multi-tenant**: kjør `supabase/migration_v3.sql` som introduserer Supabase Auth, households og co-parent-sharing.

### Etter v3-migrasjon

Den eksisterende dataen din ligger nå i en "Min familie"-husholdning som er foreldreløs. For å claime den:

1. Åpne appen → du blir sendt til `/auth/signup`
2. Registrer deg med din e-post + passord
3. I Supabase SQL Editor, kjør (bytt ut e-posten):
   ```sql
   insert into household_members (household_id, user_id, role, display_name)
   select h.id, u.id, 'owner', 'Pappa'
   from households h, auth.users u
   where h.name = 'Min familie'
   and u.email = 'din-epost@eksempel.no';
   ```
4. Last appen på nytt → du er nå koblet til den eksisterende dataen!

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

XP regnes **per periode** (besøk eller kalenderuke) og nullstilles når en periode avsluttes.
Hver godkjent oppgave gir 10 XP (kan justeres per oppgave).

**Balansering** — beregnet for et typisk besøk på en uke:
- Minimum (3 oppg × 5 hverdager + 2 oppg × 2 helgedager = 19 oppgaver) → ~Level 7 (Legende)
- For å nå Level 10 (Magisk Konge) trengs ~28 oppgaver i perioden

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

## 📅 Custody-perioder

Hvis barna er hos deg deler av tiden (f.eks. annenhver uke eller fra fredag til onsdag = 13 dager), opprett en **periode** under fanen "Perioder":

1. Velg barn, start- og slutt-dato, og evt. en etikett ("Uke 19")
2. Når barnet er hos deg, vises perioden som "AKTIV"
3. XP og nivå regnes for den aktive perioden
4. Etter perioden er over, trykk **"Avslutt og lås inn"** — dette låser inn Level-resultatet, øker strekk-telleren hvis Level 10 ble nådd, og starter på 0 XP når en ny periode begynner
5. Lag perioder for hvert besøk fremover så er du klar

Hvis du ikke bruker perioder, brukes vanlig kalenderuke (man-søn) automatisk.

## 🔥 Strekk-bonus

For å motivere til langsiktig innsats:
1. Gå til "Strekk"-fanen
2. Standardbonusen "3-på-rad-bonus" er allerede satt opp — gir 50 kr hvis barnet når Level 10 i 3 perioder på rad
3. Lag flere etter ønske (5-på-rad, 10-på-rad, osv.)
4. Når kravet er nådd, kan du gi bonusen med ett trykk

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
