"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import SetupNotice from "@/components/SetupNotice";
import LegalFooter from "@/components/LegalFooter";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured) return <SetupNotice />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Feil e-post eller passord"
        : error.message);
      return;
    }
    router.push("/");
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
          <h1 className="text-2xl font-extrabold text-purple-900">Logg inn</h1>
          <p className="text-purple-600 font-medium text-sm">Velkommen tilbake</p>
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
            <label className="block text-sm font-bold text-purple-700 mb-1">Passord</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
            />
          </div>
          {error && (
            <div className="bg-red-50 text-red-700 text-sm font-semibold p-3 rounded-xl">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Logger inn..." : "Logg inn"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-purple-100" />
          <span className="text-xs font-bold text-purple-400 uppercase">eller</span>
          <div className="flex-1 h-px bg-purple-100" />
        </div>

        <GoogleSignInButton label="Logg inn med Google" />

        <div className="text-center mt-4 space-y-2">
          <Link href="/auth/forgot" className="text-sm text-purple-600 font-semibold hover:underline block">
            Glemt passord?
          </Link>
          <div className="text-sm text-purple-700">
            Ny her?{" "}
            <Link href="/auth/signup" className="font-bold text-purple-900 hover:underline">
              Lag konto
            </Link>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <LegalFooter />
      </div>
    </div>
  );
}
