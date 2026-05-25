import Link from "next/link";

export const metadata = {
  title: "Personvernerklæring | Gjøre",
};

export default function PersonvernPage() {
  return (
    <div className="min-h-screen p-6 sm:p-10 max-w-3xl mx-auto">
      <Link
        href="/"
        className="text-purple-600 font-semibold text-sm mb-4 inline-block hover:underline"
      >
        ← Tilbake
      </Link>
      <article className="prose prose-purple max-w-none text-purple-900 space-y-4">
        <h1 className="text-3xl font-extrabold">Personvernerklæring</h1>
        <p className="text-sm text-purple-600">
          Sist oppdatert: {new Date().toLocaleDateString("nb-NO")} <br />
          Tjeneste: <strong>Gjøre</strong> (heretter "tjenesten" eller "appen")
        </p>

        <h2 className="text-2xl font-bold mt-6">1. Dataansvarlig</h2>
        <div className="bg-purple-50 rounded-xl p-4">
          <p>
            <strong>Intellisense AS</strong>
            <br />
            Org.nr: 933 698 262
            <br />
            E-post:{" "}
            <a className="underline" href="mailto:andreaalborg@intellisenseai.no">
              andreaalborg@intellisenseai.no
            </a>
          </p>
        </div>
        <p>
          Intellisense AS (org.nr 933 698 262) er dataansvarlig for behandling av
          personopplysninger i Gjøre. Henvendelser om personvern, innsyn, retting eller
          sletting kan sendes til e-posten over. Vi svarer innen 30 dager.
        </p>

        <h2 className="text-2xl font-bold mt-6">2. Hvilke opplysninger vi behandler</h2>
        <p>For å levere tjenesten behandler vi følgende kategorier:</p>

        <h3 className="text-xl font-semibold mt-4">Om foreldre/voksne</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>E-postadresse (innlogging, varsler)</li>
          <li>Passord (lagres kryptert / hashed av vår leverandør Supabase)</li>
          <li>Visningsnavn du oppgir</li>
          <li>PIN-kode du selv velger for rask profil-bytte</li>
          <li>Husholdningsnavn og innstillinger</li>
          <li>Tidspunkt for innlogginger (sikkerhetslogg)</li>
        </ul>

        <h3 className="text-xl font-semibold mt-4">Om barna</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Fornavn (eller kallenavn) som forelder selv legger inn</li>
          <li>Fødselsdato (valgfritt; brukes til å beregne alder)</li>
          <li>Avatar (emoji + farge) — ikke ekte bilde</li>
          <li>PIN-kode (4-6 sifre) som forelder velger</li>
          <li>Aktivitet i appen: hvilke oppgaver som er krysset av, godkjent, saldo, XP</li>
          <li>Historikk over fullføringer og perioder</li>
        </ul>
        <p>
          Vi samler <strong>aldri inn etternavn, adresse, telefonnummer, e-post eller bilder
          av barn</strong> uten at forelderen aktivt legger det inn i et navnefelt. Vi
          oppfordrer til å bruke fornavn eller kallenavn.
        </p>

        <h2 className="text-2xl font-bold mt-6">3. Behandlingsgrunnlag</h2>
        <p>Vi behandler personopplysningene basert på:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Avtale</strong> (GDPR art. 6 nr. 1 b) — for å levere tjenesten du har
            registrert deg for
          </li>
          <li>
            <strong>Foreldresamtykke</strong> (GDPR art. 8) for behandling av barnas data — du
            som forelder/verge bekrefter at du har myndighet til å registrere barna
          </li>
          <li>
            <strong>Berettiget interesse</strong> (GDPR art. 6 nr. 1 f) — for sikkerhetslogg
            og forebygging av misbruk
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-6">4. Hvor lagres dataen?</h2>
        <p>
          Alle data lagres innenfor EU/EØS hos vår databaseleverandør{" "}
          <strong>Supabase</strong> (EU-region). Vi bruker også:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Vercel</strong> for hosting av nettsiden (EU-region)
          </li>
          <li>
            <strong>Resend</strong> for utsending av e-post (transaksjonelle e-poster)
          </li>
          <li>
            <strong>Stripe</strong> for betaling (når abonnement er aktivt) — kun betalingsdata,
            ikke barnedata
          </li>
        </ul>
        <p>
          Alle leverandører er pålagt databehandleravtaler i tråd med GDPR.
        </p>

        <h2 className="text-2xl font-bold mt-6">5. Hvor lenge lagrer vi data?</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Mens kontoen er aktiv:</strong> så lenge du bruker tjenesten
          </li>
          <li>
            <strong>Etter at du sletter kontoen:</strong> alt slettes umiddelbart fra
            produksjonsdatabasen. Backups oppbevares i opptil 30 dager før de overskrives.
          </li>
          <li>
            <strong>Fakturering:</strong> regnskapsmessig oppbevaring i 5 år (lovpålagt) hos
            Stripe — kun fakturadata, ikke selve appdataen
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-6">6. Dine rettigheter</h2>
        <p>
          Du har rett til å:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Få innsyn</strong> i alle data vi har om deg og dine barn
          </li>
          <li>
            <strong>Få rettet</strong> uriktige eller utdaterte opplysninger
          </li>
          <li>
            <strong>Få slettet</strong> kontoen og all tilhørende data
          </li>
          <li>
            <strong>Eksportere</strong> dataen i maskinlesbart format (JSON)
          </li>
          <li>
            <strong>Trekke tilbake samtykke</strong> — tilsvarer sletting av konto
          </li>
          <li>
            <strong>Klage til Datatilsynet</strong> hvis du mener vi ikke overholder
            personvernlovgivningen — se{" "}
            <a
              className="underline"
              href="https://www.datatilsynet.no"
              target="_blank"
              rel="noreferrer"
            >
              datatilsynet.no
            </a>
          </li>
        </ul>
        <p>
          Alle disse handlingene kan du utføre selv via{" "}
          <strong>Innstillinger</strong> i appen, eller ved å kontakte oss.
        </p>

        <h2 className="text-2xl font-bold mt-6">7. Spesielt om barnas data</h2>
        <p>
          Vi tar barnas personvern alvorlig:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Vi viser ikke barnas data eller aktivitet til noen utenfor husholdningen</li>
          <li>Vi bruker ikke barnas data til markedsføring eller profilering</li>
          <li>Vi bruker ikke tredjeparts analyse- eller annonseverktøy</li>
          <li>Vi krever foreldresamtykke ved registrering (jf. GDPR art. 8)</li>
          <li>Vi bruker minimum-prinsippet — kun det som trengs for å levere tjenesten</li>
        </ul>

        <h2 className="text-2xl font-bold mt-6">8. Sikkerhet</h2>
        <p>
          Vi tar i bruk anerkjente sikkerhetstiltak:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>All trafikk krypteres med HTTPS/TLS</li>
          <li>Passord hashes med bcrypt eller tilsvarende av Supabase Auth</li>
          <li>Rad-nivå-sikkerhet (Row Level Security) i databasen — én familie ser bare sin egen data</li>
          <li>Tilgangslogging og automatisk monitoring</li>
        </ul>

        <h2 className="text-2xl font-bold mt-6">9. Cookies</h2>
        <p>
          Vi bruker tekniske cookies som er nødvendige for innlogging og funksjonalitet.
          Detaljer i vår{" "}
          <Link href="/cookies" className="underline font-semibold">
            cookie-policy
          </Link>
          .
        </p>

        <h2 className="text-2xl font-bold mt-6">10. Endringer i erklæringen</h2>
        <p>
          Vesentlige endringer varsles med e-post og/eller varsel i appen minst 14 dager
          før de trer i kraft.
        </p>

        <h2 className="text-2xl font-bold mt-6">11. Kontakt</h2>
        <p>
          Spørsmål om personvern? Send oss en e-post til{" "}
          <a className="underline" href="mailto:andreaalborg@intellisenseai.no">
            andreaalborg@intellisenseai.no
          </a>
          . Vi svarer innen 30 dager.
        </p>

        <hr className="my-8 border-purple-200" />
        <p className="text-xs text-purple-500">
          Denne erklæringen følger GDPR (forordning 2016/679) og norsk personopplysningslov.
        </p>
      </article>
    </div>
  );
}
