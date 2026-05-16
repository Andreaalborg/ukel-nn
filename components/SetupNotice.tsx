"use client";

export default function SetupNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card p-8 max-w-2xl space-y-4">
        <div className="text-5xl">⚙️</div>
        <h1 className="text-3xl font-extrabold text-purple-900">Setup mangler</h1>
        <p className="text-purple-800">
          Du må koble til Supabase for at appen skal virke. Følg disse stegene:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-purple-800">
          <li>
            Gå til <a className="underline font-semibold" href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a> og lag et gratis prosjekt.
          </li>
          <li>I prosjektet ditt, åpne <b>SQL Editor</b> og kjør innholdet i <code className="bg-purple-100 px-1 rounded">supabase/schema.sql</code>.</li>
          <li>Gå til <b>Project Settings → API</b> og kopier <b>Project URL</b> og <b>anon public key</b>.</li>
          <li>
            Lag en fil som heter <code className="bg-purple-100 px-1 rounded">.env.local</code> i prosjektmappen med:
            <pre className="bg-slate-900 text-green-300 text-xs p-3 rounded-lg mt-2 overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://din-prosjekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key`}
            </pre>
          </li>
          <li>Restart serveren (<code className="bg-purple-100 px-1 rounded">npm run dev</code>).</li>
        </ol>
        <p className="text-sm text-purple-500">Se README.md for full guide.</p>
      </div>
    </div>
  );
}
