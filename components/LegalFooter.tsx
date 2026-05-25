"use client";

import Link from "next/link";

export default function LegalFooter() {
  return (
    <footer className="text-center text-xs text-purple-400 py-4 px-4 space-x-3">
      <Link href="/personvern" className="hover:underline">
        Personvern
      </Link>
      <span>·</span>
      <Link href="/vilkar" className="hover:underline">
        Vilkår
      </Link>
      <span>·</span>
      <Link href="/cookies" className="hover:underline">
        Cookies
      </Link>
      <span>·</span>
      <Link href="/kontakt" className="hover:underline">
        Kontakt
      </Link>
    </footer>
  );
}
