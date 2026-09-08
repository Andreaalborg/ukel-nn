"use client";

import DagsplanView from "@/components/DagsplanView";

/**
 * Nøstet under app/forelder/layout.tsx — arver sidemenyen via Next.js
 * sin egen persistent-layout-mekanisme, akkurat som alle andre
 * /forelder/*-sider. Ingen full remount av sidemenyen ved navigering.
 */
export default function ForelderDagsplanPage() {
  return <DagsplanView embedded />;
}
