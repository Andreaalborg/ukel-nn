import Link from "next/link";

export const metadata = {
  title: "Brukervilkår | Gjøre",
};

export default function VilkarPage() {
  return (
    <div className="min-h-screen p-6 sm:p-10 max-w-3xl mx-auto">
      <Link
        href="/"
        className="text-purple-600 font-semibold text-sm mb-4 inline-block hover:underline"
      >
        ← Tilbake
      </Link>
      <article className="prose prose-purple max-w-none text-purple-900 space-y-4">
        <h1 className="text-3xl font-extrabold">Brukervilkår</h1>
        <p className="text-sm text-purple-600">
          Sist oppdatert: {new Date().toLocaleDateString("nb-NO")} <br />
          Tjeneste: <strong>Gjøre</strong>
        </p>

        <h2 className="text-2xl font-bold mt-6">1. Om tjenesten</h2>
        <p>
          Gjøre er en familieapp for ukeslønn og oppgavehåndtering levert av{" "}
          <strong>Intellisense AS</strong> (org.nr 933 698 262). Ved å bruke tjenesten
          aksepterer du disse vilkårene.
        </p>

        <h2 className="text-2xl font-bold mt-6">2. Hvem kan bruke tjenesten</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Du må være myndig (18 år eller eldre) for å opprette en konto</li>
          <li>Du må være forelder eller juridisk verge til barna du legger til</li>
          <li>Du må gi sannferdig informasjon ved registrering</li>
          <li>Du må holde innloggingsdetaljer (e-post, passord, PIN) hemmelig</li>
        </ul>

        <h2 className="text-2xl font-bold mt-6">3. Foreldresamtykke (GDPR art. 8)</h2>
        <p>
          Ved å akseptere disse vilkårene og legge til et barn i appen bekrefter du at:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Du er forelder eller verge til barnet</li>
          <li>Du har rett til å registrere barnets navn og data i tjenesten</li>
          <li>Du samtykker på vegne av barnet til behandlingen som beskrevet i personvernerklæringen</li>
          <li>Du har, der det er aktuelt, informert den andre forelder</li>
        </ul>
        <p className="text-sm text-purple-600 mt-2">
          Dette samtykket gis automatisk når du krysser av for å godta vilkår og personvernerklæring
          ved registrering, og kan trekkes tilbake når som helst ved å slette kontoen.
        </p>

        <h2 className="text-2xl font-bold mt-6">4. Abonnement og betaling</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Vi tilbyr både gratis bruk (med begrensninger) og betalt abonnement</li>
          <li>Priser vises i appen og oppgis inkl. MVA</li>
          <li>Abonnementet fornyes automatisk inntil du sier opp</li>
          <li>Oppsigelse skjer selvbetjent i appen og trer i kraft ved slutten av inneværende periode</li>
          <li>Betalingsdata behandles av Stripe; vi lagrer ikke kortinformasjon</li>
          <li>Ved oppgradering belastes du dagen oppgraderingen skjer; ved nedgradering tar endringen effekt ved neste fornyelse</li>
        </ul>

        <h2 className="text-2xl font-bold mt-6">5. Angrerett</h2>
        <p>
          Etter angrerettloven har du som forbruker normalt 14 dagers angrerett ved kjøp
          av tjenester på nett. Når du tar tjenesten i bruk under angrefristen, samtykker
          du i at vi begynner leveringen og at angreretten dermed bortfaller. Hvis du ikke
          har tatt tjenesten i bruk innen 14 dager, kan du kreve full refusjon ved å
          kontakte oss.
        </p>

        <h2 className="text-2xl font-bold mt-6">6. Akseptabel bruk</h2>
        <p>Du skal ikke:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Bruke tjenesten til ulovlig formål</li>
          <li>Forsøke å få tilgang til andres familiedata</li>
          <li>Reverse-engineere, kopiere eller distribuere appen uten samtykke</li>
          <li>Bruke automatiserte verktøy (bots, scrapers) mot tjenesten</li>
          <li>Sende skadelig kode eller forsøke å forstyrre tjenesten</li>
        </ul>

        <h2 className="text-2xl font-bold mt-6">7. Vår rett til å stenge konto</h2>
        <p>
          Vi forbeholder oss retten til å stenge eller fjerne kontoer som bryter med
          disse vilkårene, etter forvarsel der det er mulig. Ved alvorlige brudd
          (f.eks. ulovlig innhold) kan stenging skje umiddelbart.
        </p>

        <h2 className="text-2xl font-bold mt-6">8. Endringer i tjenesten</h2>
        <p>
          Vi kan endre, oppdatere eller stoppe funksjoner i tjenesten. Vesentlige
          endringer varsles minst 14 dager i forveien. Hvis vi stenger tjenesten helt,
          får du minst 60 dagers varsel og mulighet til å eksportere data.
        </p>

        <h2 className="text-2xl font-bold mt-6">9. Ansvarsfraskrivelse</h2>
        <p>
          Gjøre leveres "som den er". Vi gjør vårt beste for å holde tjenesten oppe og
          dataen trygg, men kan ikke garantere uavbrutt drift eller at den passer for
          ethvert formål. Vi er ikke ansvarlig for:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Indirekte tap eller følgeskader</li>
          <li>Tap som følge av tredjeparts handlinger (f.eks. Supabase, Vercel)</li>
          <li>Pengetap som følge av uenighet mellom forelder og barn om ukeslønn</li>
        </ul>
        <p>
          Vårt samlede ansvar er begrenset til hva du har betalt for tjenesten de siste
          12 månedene.
        </p>

        <h2 className="text-2xl font-bold mt-6">10. Personvern</h2>
        <p>
          Se vår{" "}
          <Link href="/personvern" className="underline font-semibold">
            personvernerklæring
          </Link>{" "}
          for hvordan vi behandler personopplysninger.
        </p>

        <h2 className="text-2xl font-bold mt-6">11. Lovvalg og verneting</h2>
        <p>
          Norsk rett gjelder. Tvister forsøkes løst i minnelighet. Hvis ikke, behandles
          tvister ved norske domstoler etter alminnelige vernetingsregler.
        </p>

        <h2 className="text-2xl font-bold mt-6">12. Kontakt</h2>
        <p>
          Spørsmål? Send en e-post til{" "}
          <a className="underline" href="mailto:andreaalborg@intellisenseai.no">
            andreaalborg@intellisenseai.no
          </a>
          .
        </p>

        <hr className="my-8 border-purple-200" />
        <p className="text-xs text-purple-500">
          Disse vilkårene er underlagt norsk forbrukerrett og angrerettloven.
        </p>
      </article>
    </div>
  );
}
