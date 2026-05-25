import Link from "next/link";

export const metadata = {
  title: "Kontakt | Gjøre",
};

export default function KontaktPage() {
  return (
    <div className="min-h-screen p-6 sm:p-10 max-w-2xl mx-auto">
      <Link
        href="/"
        className="text-purple-600 font-semibold text-sm mb-4 inline-block hover:underline"
      >
        ← Tilbake
      </Link>

      <div className="card p-6 sm:p-8 space-y-5">
        <div className="text-center">
          <div className="text-5xl mb-2">✉️</div>
          <h1 className="text-3xl font-extrabold text-purple-900">Kontakt oss</h1>
          <p className="text-purple-600 mt-1">
            Vi svarer alle henvendelser innen 2 virkedager (personvern innen 30 dager).
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs font-bold text-purple-500 uppercase">Selskap</div>
            <div className="font-extrabold text-purple-900">Intellisense AS</div>
            <div className="text-sm text-purple-700">Org.nr 933 698 262</div>
          </div>

          <div>
            <div className="text-xs font-bold text-purple-500 uppercase">E-post</div>
            <a
              href="mailto:andreaalborg@intellisenseai.no"
              className="text-purple-700 underline font-semibold"
            >
              andreaalborg@intellisenseai.no
            </a>
            <div className="text-xs text-purple-500 mt-1">
              Bruk e-post for all kontakt — vi svarer raskt.
            </div>
          </div>
        </div>

        <hr className="border-purple-100" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
          <Link
            href="/personvern"
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-sm py-2 rounded-xl"
          >
            🔒 Personvern
          </Link>
          <Link
            href="/vilkar"
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-sm py-2 rounded-xl"
          >
            📜 Vilkår
          </Link>
          <Link
            href="/cookies"
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-sm py-2 rounded-xl"
          >
            🍪 Cookies
          </Link>
        </div>
      </div>

      <p className="text-xs text-center text-purple-400 mt-6">
        Klage på behandling av personopplysninger kan også rettes til{" "}
        <a
          href="https://www.datatilsynet.no"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Datatilsynet
        </a>
        .
      </p>
    </div>
  );
}
