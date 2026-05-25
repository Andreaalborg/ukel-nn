"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "gjore:cookie-consent";

type Consent = {
  necessary: true;
  analytics: boolean;
  timestamp: string;
};

export function getConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    if (!consent) {
      // Vent litt så det ikke blokkerer initial render
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const save = (analytics: boolean) => {
    const consent: Consent = {
      necessary: true,
      analytics,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[60] p-3 sm:p-4"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="card max-w-2xl mx-auto p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="text-3xl flex-shrink-0">🍪</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-purple-900">
                  Vi bruker nødvendige cookies for innlogging. Vil du i tillegg hjelpe oss
                  forbedre tjenesten med anonymisert bruksstatistikk?{" "}
                  <Link
                    href="/cookies"
                    className="underline font-semibold text-purple-700"
                  >
                    Les mer
                  </Link>
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => save(false)}
                    className="btn-ghost text-sm py-1.5 px-3"
                  >
                    Kun nødvendig
                  </button>
                  <button
                    onClick={() => save(true)}
                    className="btn-primary text-sm py-1.5 px-3"
                  >
                    Godta alle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
