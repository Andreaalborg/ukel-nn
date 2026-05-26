# Oppsett av betalingsmetoder og Google-innlogging

## 💳 Stripe: aktiver Vipps, Apple Pay og Google Pay

### Apple Pay og Google Pay (automatisk)

Disse er **allerede aktive** i Stripe Checkout — de vises automatisk når:
- **Apple Pay:** kunden bruker Safari/iOS og har et Apple Pay-kort i Wallet
- **Google Pay:** kunden bruker Chrome med et Google Pay-kort

Du trenger ikke å gjøre noe ekstra. Stripe håndterer alt.

**Verifiser at de er på:**
1. Stripe Dashboard → **Settings** (tannhjul-ikon)
2. **Payment methods**
3. Sjekk at **Apple Pay** og **Google Pay** har grønn ✓ status under "Wallets"

### Vipps

Vipps er tilgjengelig i Stripe i Norge, men må aktiveres:

1. Stripe Dashboard → **Settings** → **Payment methods**
2. Finn **Vipps** under "Buy now, pay later" eller "Bank redirects" (Stripe har endret kategoriene)
3. Trykk **Enable** eller **Turn on**
4. Følg Stripes guide for å koble til Vipps-kontoen din

**Etter aktivering** behøver du ikke endre noe i koden — `allow_promotion_codes: true` i vår
checkout-config gjør at Stripe Checkout automatisk viser alle aktiverte betalingsmetoder.

## 🔐 Google-innlogging: Supabase + Google Cloud Console

### Steg 1: Lag OAuth Client i Google Cloud Console

1. Gå til [Google Cloud Console](https://console.cloud.google.com)
2. Lag et nytt prosjekt (eller bruk eksisterende) — kall det **Gjøre**
3. Venstre meny → **APIs & Services** → **OAuth consent screen**
   - User Type: **External**
   - App name: `Gjøre`
   - User support email: `andreaalborg@intellisenseai.no`
   - Developer contact: `andreaalborg@intellisenseai.no`
   - Authorized domains: legg til `supabase.co` og `gjore.no`
   - **Save and continue**
   - Scopes: **Save and continue** (default holder)
   - Test users: legg til din e-post + andre testere (kan endre senere)
   - **Save and continue**

4. Venstre meny → **Credentials** → **+ Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `Gjøre Web Client`
   - **Authorized redirect URIs** — legg til:
     - `https://[ditt-supabase-prosjekt].supabase.co/auth/v1/callback`
     - (URL-en finner du i Supabase: Authentication → Providers → Google når du åpner den)
   - **Create**

5. Du får en dialog med:
   - **Client ID** (lang tekst som slutter på `.apps.googleusercontent.com`)
   - **Client secret**

### Steg 2: Aktiver Google-provider i Supabase

1. Supabase Dashboard → **Authentication** → **Sign In / Providers**
2. Finn **Google** i listen → klikk på den
3. Toggle **Enable Sign in with Google** → ON
4. Lim inn:
   - **Client ID (for OAuth)** — fra Google Cloud Console
   - **Client Secret (for OAuth)** — fra Google Cloud Console
5. **Save**

### Steg 3: Test

1. Gå til https://din-app.vercel.app/auth/signin
2. Du skal nå se en **"Logg inn med Google"**-knapp
3. Klikk → blir sendt til Google → logg inn → tilbake til appen
4. Første gang: dirigeres til `/onboarding` eller `/claim`
5. Neste gang: rett til `/forelder`

### Vanlige problemer

- **"redirect_uri_mismatch":** redirect URI i Google Cloud matcher ikke det Supabase forventer.
  Fiks: gå tilbake til steg 1.4 og legg til riktig URL fra Supabase Authentication → Providers → Google.

- **OAuth-consent-skjermen sier "Unverified app":** dette er normalt i utvikling. Du må eventuelt
  verifisere appen hos Google når dere går public — tar 1-3 uker. For nå kan du legge til
  test-brukere i OAuth consent screen så slipper de varselet.

- **Email allerede registrert med passord:** hvis brukeren har en konto med samme e-post via
  passord-innlogging, kan Supabase nekte å koble den til Google. Brukeren må enten bytte
  e-post eller logge inn med passord først og deretter koble Google til kontoen sin.
