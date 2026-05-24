# 🚀 Launch-plan: fra fungerende prototype til betalbar app

## 🟢 Hva vi har bygget (~80% av MVP)

**Funksjonelt:**
- Multi-tenant arkitektur (households med Supabase Auth)
- E-post + passord innlogging, signup, forgot password (med strength-indikator)
- Onboarding-wizard for nye familier
- Profil-velger med PIN for barn (på delt enhet)
- Fleksible oppgaver (daglig, ukentlig, valgte dager, intervall, engangs)
- Bonus-premier (per periode/uke/måned/manuell)
- Strekk-bonus (3 perioder på rad med level 10)
- Custody-perioder (besøksperioder for delt-omsorg)
- Saldo, utbetaling og historikk
- Periodebasert XP og 10 nivåer (Hjelper → Magisk Konge)
- Statistikk-sider for barn og foreldre
- Co-parent invite (delte husholdninger)
- Carry-over for pending tasks (oppgaver forsvinner ikke)
- Mobile-vennlig nav med hamburger
- Auto-deteksjon av sesjonsproblemer (ingen evig 🌟-loading)

**Teknisk:**
- Deployed på Vercel
- GitHub repo
- Bygger uten feil, TypeScript strict

---

## 🔴 Hva vi MÅ ha før vi kan ta betalt (kritisk)

### A. Juridisk + GDPR (1 uke)
**Hvorfor:** Vi håndterer barns data → underlagt GDPR + barnerelaterte regler. Uten dette er det ulovlig å selge i Norge.

- [ ] Personvernerklæring (på norsk, GDPR-kompatibel)
- [ ] Brukervilkår
- [ ] Cookie-banner / -policy
- [ ] Databehandleravtale med Supabase (de har mal)
- [ ] Sletteflyt — bruker MÅ kunne slette all data fra appen (ikke bare via SQL)
- [ ] Eksportflyt — bruker MÅ kunne laste ned all sin data
- [ ] Avbestillingsflyt — selvbetjent oppsigelse
- [ ] Foreldresamtykke ved registrering ("Jeg er forelder/verge til barna i appen")
- **Verktøy:** [iubenda.com](https://iubenda.com) eller [lawly.no](https://lawly.no) genererer maler for ~500-1500 kr

### B. Domene + e-post (3 dager)
**Hvorfor:** vercel.app-URL gir ikke tillit. E-post fra noreply@mail.supabase.io går i spam.

- [ ] Kjøpe domene (forslag: `ukeslonn.no`, `lommepenger.no`, `barnehelt.no`)
- [ ] Koble domene til Vercel (gratis, peker DNS)
- [ ] Sette opp **Resend** (3000 mail/mnd gratis) som SMTP i Supabase
- [ ] Verifisere domenet i Resend (SPF, DKIM, DMARC)
- [ ] Tilpasse e-postmaler i Supabase med vårt brand (bekreftelse, passordreset, invite)

### C. Betaling + abonnement (2 uker)
**Hvorfor:** Vi har ingen måte å ta penger på i dag.

**Anbefalt løsning: Stripe**
- Billigst (1.4% + 1.80 kr per transaksjon i Europa)
- Stripe Checkout = ferdig betalingsside, vi slipper å bygge
- Stripe Customer Portal = ferdig "behandle abonnement"-side
- Stripe Tax håndterer MVA automatisk

**Implementasjon:**
- [ ] Stripe-konto + verifisert (kan ta noen dager)
- [ ] Lag prisplaner i Stripe Dashboard (49 kr/mnd, 399 kr/år)
- [ ] DB-schema: `subscriptions` tabell + felt på `households` (plan, status, trial_ends_at, stripe_customer_id)
- [ ] Checkout-flyt: `/forelder/oppgrader` → Stripe Checkout → tilbake
- [ ] Webhook-håndtering for `checkout.session.completed`, `customer.subscription.deleted`, etc.
- [ ] Customer Portal-link i innstillinger ("Behandle abonnement")
- [ ] Feature-gating: hva er gratis vs Premium

### D. Landingsside (1 uke)
**Hvorfor:** Vi trenger noe å markedsføre. Folk må forstå hva de kjøper FØR de signer opp.

- [ ] Hero med video/GIF som viser appen i bruk
- [ ] "Hvordan det funker" i 3 steg
- [ ] Skjermbilder/mockups på flere enheter
- [ ] Pris-tabell (Gratis vs Familie 49 kr/mnd)
- [ ] FAQ
- [ ] "Lag konto" / "Logg inn" CTA-er
- [ ] SEO-grunnleggende (meta-tags, OG-bilde, sitemap)

### E. Sikkerhet + monitoring (3 dager)
**Hvorfor:** Når ekte penger og barnedata er involvert, må vi vite om feil før kundene melder dem.

- [ ] **Sentry** (gratis tier) for error monitoring
- [ ] **Supabase Pro** ($25/mnd) — for backups, point-in-time recovery, høyere rate limits
- [ ] Sjekk alle RLS-policyer holder vann (ingen lekkasje mellom families)
- [ ] HTTPS forced + HSTS-header
- [ ] Rate limit på Supabase Auth (Supabase har dette innebygd)
- [ ] Slå på "Prevent leaked passwords" (Supabase Pro-feature)

---

## 🟡 Bør ha (gjør appen bedre — kan komme rett etter launch)

- **Analytics:** PostHog (gratis 1M events/mnd) — vit hva folk faktisk gjør
- **Customer support:** Crisp.chat gratis tier — chat-widget på siden
- **FAQ/Hjelp:** /hjelp-side med vanlige spørsmål
- **App-ikon + favicon + manifest** — så appen ser pen ut når den legges på hjemmeskjerm
- **PWA-konfig** — så folk kan "installere" webappen som en app uten App Store
- **"Glemt PIN" for barn** — forelder kan se/endre barnets PIN
- **Ferie-modus** — pause alle oppgaver i X dager
- **Pull-to-refresh** på mobil
- **Velkomst-e-post** med tips og bruksanvisning
- **Onboarding-video** (1 min) i wizarden

---

## 🟢 Nice to have (post-launch)

- **iOS-app** via Capacitor (uke 4-6 etter launch)
- **Android-app** via samme Capacitor-build
- **Push-notifikasjoner** (krever native app)
- **Apple Watch / WearOS** — fullføre oppgaver fra klokka
- **Vipps-integrasjon** — faktisk overføring til barnets sparekonto
- **Familierapport via e-post** til besteforeldre (månedlig)
- **AI-forslag** — "basert på alder X, prøv disse oppgavene"
- **Klassemodus** — B2B-versjon for SFO/skoler
- **Engelsk språkstøtte** — for å åpne for Sverige/Danmark

---

## 💰 Foreslått prisstrategi

### Gratis
- 1 barn
- Opp til 10 oppgaver
- Basic stats
- Daglige + ukentlige oppgaver
- Ingen custody-perioder
- Ingen strekk-bonus
- Ingen co-parent invite

### Familie — 49 kr/mnd eller 399 kr/år (33 kr/mnd, sparer 17%)
- **Ubegrenset** barn og oppgaver
- Alle oppgavetyper (intervall, dager etc.)
- Custody-perioder
- Strekk-bonus
- Co-parent (delte familier)
- Avanserte premier
- Full statistikk og historikk
- 14 dagers gratis prøve uten kort

### Familie+ (senere) — 99 kr/mnd
- Vipps/bank-integrasjon
- Månedsrapport til besteforeldre
- AI-forslag
- Prioritert support

---

## 📅 Foreslått tidslinje (forutsetter 20+ t/uke)

### Uke 1: Juridisk + domene + e-post
- Personvern + vilkår fra mal (Iubenda)
- Kjøp domene + DNS-konfig
- Resend-oppsett
- Cookie-banner

### Uke 2-3: Betaling
- Stripe-konto + plans
- Subscription DB + flow
- Feature gating
- Trial-logikk

### Uke 4: Landingsside
- Hero, screenshots, FAQ
- SEO + OG-bilde
- "Lag konto"-CTA

### Uke 5: Polish + GDPR-flow
- Sletteflyt + eksportflyt
- Sentry + monitoring
- Crisp-chat
- App-ikon + PWA

### Uke 6: Beta-launch
- Inviter 20-30 familier (du har allerede noen som vil ha)
- Samle vitnesbyrd
- Iterere på feedback

### Uke 7-8: Public launch
- Lansering på Product Hunt
- Reddit/Facebook-grupper
- PR-pitch til VG, Foreldre & Barn
- Influencer-outreach

**Tidligst lansering: ~7-8 uker fra nå med fokusert innsats**

---

## 💸 Realistisk månedlig kostnad ved launch

| Tjeneste | Kostnad/mnd |
|----------|-------------|
| Supabase Pro | ~270 NOK ($25) |
| Vercel Hobby (gratis) eller Pro | 0-220 NOK |
| Resend (free tier) | 0 NOK |
| Sentry (free tier) | 0 NOK |
| PostHog (free tier) | 0 NOK |
| Crisp (free tier) | 0 NOK |
| Stripe (3% av inntekt) | variabelt |
| **Sum minimum** | **~270 NOK/mnd** |

Engangskostnader:
- Domene: ~150 NOK/år
- Legal-maler: ~1000-1500 NOK
- Apple Developer (kun for iOS senere): $99/år

**Break-even: ~6 betalende familier dekker driftskostnaden.**

---

## 🎯 Min anbefalte rekkefølge akkurat nå

1. **Først:** Stille noen avklarings-spørsmål om pris, navn, prioriteringer
2. **Deretter:** Bygge i denne rekkefølgen:
   - Juridisk infrastruktur (lavt arbeid, høy risiko hvis utelatt)
   - Domene + Resend (gir profesjonell følelse)
   - Stripe-integrering (selve betalingsmotoren)
   - Landingsside (markedsføringsverktøyet)
   - Polish (Sentry, GDPR-flow, app-ikon)
   - Beta-launch til de som allerede vil teste
   - Public launch med PR-stunt
