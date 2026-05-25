import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY && process.env.NODE_ENV !== "test") {
  console.warn("[stripe] Missing STRIPE_SECRET_KEY");
}

export const stripe = new Stripe(STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  typescript: true,
});

/** Mapping fra plan-key til Stripe price ID. Sett disse i env-variabler.
 *  Disse er kun referert server-side. */
export const STRIPE_PRICES = {
  family_monthly: process.env.STRIPE_PRICE_FAMILY_MONTHLY,
  family_yearly: process.env.STRIPE_PRICE_FAMILY_YEARLY,
  lifetime: process.env.STRIPE_PRICE_LIFETIME,
} as const;

export type PlanKey = keyof typeof STRIPE_PRICES;

export function getPlanFromPriceId(priceId: string | null | undefined):
  | "family_monthly"
  | "family_yearly"
  | "lifetime"
  | null {
  if (!priceId) return null;
  if (priceId === STRIPE_PRICES.family_monthly) return "family_monthly";
  if (priceId === STRIPE_PRICES.family_yearly) return "family_yearly";
  if (priceId === STRIPE_PRICES.lifetime) return "lifetime";
  return null;
}
