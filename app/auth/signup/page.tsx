"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import SetupNotice from "@/components/SetupNotice";
import PasswordStrength, { MIN_PASSWORD_LENGTH } from "@/components/PasswordStrength";
import LegalFooter from "@/components/LegalFooter";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!isSupabaseConfigured) return <SetupNotice />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Passord må være minst ${MIN_PASSWORD_LENGTH} tegn`);
      return;
    }
    if (!acceptTerms) {
      setError("Du må godta brukervilkårene og personvernerklæringen");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.user && !data.session) {
      setInfo("Sjekk e-posten din for å bekrefte kontoen før du logger inn!");
      return;
    }
    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      <div className="w-full max-w-md mb-4">
        <Link
          href="/"
          className="text-purple-600 font-semibold text-sm hover:text-purple-800 inline-flex items-center gap-1"
        >
          ← Til forsiden
        </Link>
      </div>
      <div className="card w-full max-w-md p-6">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <span className="text-3xl animate-float">🌟</span>
            <span className="text-2xl font-extrabold text-purple-900">Gjøre</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-purple-900">Lag konto</h1>
          <p className="text-purple-600 font-medium text-sm">Start gratis i 14 dager</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1">E-post</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1">
              Passord (min {MIN_PASSWORD_LENGTH} tegn)
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
            />
            <PasswordStrength password={password} />
          </div>
          <div className="pt-2 border-t border-purple-100">
            <label className="flex items-start gap-2 text-xs text-purple-700 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-purple-600"
              />
              <span>
                Jeg godtar{" "}
                <Link href="/vilkar" target="_blank" className="underline font-semibold">
                  brukervilkårene
                </Link>{" "}
                og{" "}
                <Link href="/personvern" target="_blank" className="underline font-semibold">
                  personvernerklæringen
                </Link>
                . Som forelder/verge samtykker jeg til behandling av barnas opplysninger
                som beskrevet (GDPR art. 8).
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm font-semibold p-3 rounded-xl">{error}</div>
          )}
          {info && (
            <div className="bg-green-50 text-green-700 text-sm font-semibold p-3 rounded-xl">{info}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Oppretter..." : "Lag konto"}
          </button>
        </form>

        <div className="text-center mt-4 text-sm text-purple-700">
          Har du allerede konto?{" "}
          <Link href="/auth/signin" className="font-bold text-purple-900 hover:underline">
            Logg inn
          </Link>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <LegalFooter />
      </div>
    </div>
  );
}
