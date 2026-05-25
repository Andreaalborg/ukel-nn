"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import SetupNotice from "@/components/SetupNotice";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured) return <SetupNotice />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
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
            <span className="text-3xl">🌟</span>
            <span className="text-2xl font-extrabold text-purple-900">Gjøre</span>
          </Link>
          <div className="text-3xl mt-2">🔑</div>
          <h1 className="text-xl font-extrabold text-purple-900">Glemt passord?</h1>
          <p className="text-purple-600 font-medium text-sm">
            Vi sender deg en lenke for å lage nytt passord
          </p>
        </div>

        {done ? (
          <div className="bg-green-50 text-green-700 text-sm font-semibold p-4 rounded-xl text-center">
            ✓ Sjekk e-posten din!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="E-post"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
            />
            {error && (
              <div className="bg-red-50 text-red-700 text-sm font-semibold p-3 rounded-xl">{error}</div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Sender..." : "Send lenke"}
            </button>
          </form>
        )}

        <div className="text-center mt-4">
          <Link href="/auth/signin" className="text-sm text-purple-600 font-semibold hover:underline">
            ← Tilbake til innlogging
          </Link>
        </div>
      </div>
    </div>
  );
}
