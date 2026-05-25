import Link from "next/link";

export const metadata = {
  title: "Cookie-policy | Gjøre",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen p-6 sm:p-10 max-w-3xl mx-auto">
      <Link
        href="/"
        className="text-purple-600 font-semibold text-sm mb-4 inline-block hover:underline"
      >
        ← Tilbake
      </Link>
      <article className="prose prose-purple max-w-none text-purple-900 space-y-4">
        <h1 className="text-3xl font-extrabold">Cookie-policy</h1>
        <p className="text-sm text-purple-600">
          Sist oppdatert: {new Date().toLocaleDateString("nb-NO")}
        </p>

        <h2 className="text-2xl font-bold mt-6">Hva er cookies?</h2>
        <p>
          Cookies er små tekstfiler som lagres i nettleseren din. Vi bruker dem og
          tilsvarende teknologier (localStorage) for å levere tjenesten Gjøre.
        </p>

        <h2 className="text-2xl font-bold mt-6">Hvilke cookies bruker vi?</h2>

        <h3 className="text-xl font-semibold mt-4">1. Nødvendige (kan ikke skrus av)</h3>
        <p>
          Disse trengs for at appen skal fungere. Du kan ikke samtykke bort disse
          uten å logge ut.
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Supabase Auth</strong> — innloggings-token (utløper etter 1 time, fornyes automatisk)
          </li>
          <li>
            <strong>localStorage</strong> — hvilken profil som er valgt på enheten + cache av husholdnings-ID
          </li>
        </ul>

        <h3 className="text-xl font-semibold mt-4">2. Funksjonelle</h3>
        <p>
          Vi bruker kun nødvendige cookies. <strong>Ingen sporing, ingen reklame, ingen
          tredjeparts analyse</strong> som standard.
        </p>

        <h3 className="text-xl font-semibold mt-4">3. Analyse (kun ved samtykke)</h3>
        <p>
          Hvis du samtykker, bruker vi anonymisert analyse via PostHog for å forstå
          hvordan tjenesten brukes. Vi sporer kun anonyme handlinger (f.eks. "noen klikket på X"),
          aldri identifiserbar data, og aldri barnedata.
        </p>

        <h2 className="text-2xl font-bold mt-6">Hvordan styrer du cookies?</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Du kan trekke tilbake analyse-samtykke når som helst via cookie-banneret i
            bunnen av siden eller via Innstillinger
          </li>
          <li>
            Du kan slette alle cookies for nettstedet via nettleserens innstillinger
            (vil logge deg ut)
          </li>
          <li>
            Du kan blokkere alle cookies — men da fungerer ikke appen
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-6">Tredjeparter</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Supabase</strong> — autentisering og database (nødvendig)
          </li>
          <li>
            <strong>Vercel</strong> — hosting (ingen sporing)
          </li>
          <li>
            <strong>Stripe</strong> — kun aktivt på betalingsside; egne cookies for sikring av transaksjoner
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-6">Mer info</h2>
        <p>
          Se vår{" "}
          <Link href="/personvern" className="underline font-semibold">
            personvernerklæring
          </Link>{" "}
          for full oversikt over hvordan vi behandler personopplysninger.
        </p>
      </article>
    </div>
  );
}
