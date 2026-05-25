import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe, STRIPE_PRICES, type PlanKey } from "@/lib/stripe";

/**
 * Oppretter en Stripe Checkout Session for et bestemt prisvalg.
 * Krever Bearer-token i Authorization-header.
 */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server-konfig mangler" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }
  const accessToken = authHeader.slice("Bearer ".length);

  let body: { plan: PlanKey };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig request" }, { status: 400 });
  }

  const priceId = STRIPE_PRICES[body.plan];
  if (!priceId) {
    return NextResponse.json(
      { error: `Ukjent plan: ${body.plan}` },
      { status: 400 }
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Hent brukeren
  const { data: userData, error: userErr } = await admin.auth.getUser(accessToken);
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "Ugyldig sesjon" }, { status: 401 });
  }
  const user = userData.user;

  // Hent husholdningen (eieren)
  const { data: members } = await admin
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .limit(1);

  if (!members || members.length === 0) {
    return NextResponse.json({ error: "Ingen husholdning funnet" }, { status: 400 });
  }
  const householdId = members[0].household_id;

  const { data: household } = await admin
    .from("households")
    .select("*")
    .eq("id", householdId)
    .single();

  if (!household) {
    return NextResponse.json({ error: "Husholdning ikke funnet" }, { status: 404 });
  }

  // Sørg for at vi har en Stripe-customer for husholdningen
  let stripeCustomerId = household.stripe_customer_id;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: household.name,
      metadata: {
        household_id: householdId,
        user_id: user.id,
      },
    });
    stripeCustomerId = customer.id;
    await admin
      .from("households")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", householdId);
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const isLifetime = body.plan === "lifetime";

  const session = await stripe.checkout.sessions.create({
    mode: isLifetime ? "payment" : "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/forelder/oppgrader/suksess?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/forelder/oppgrader/avbrutt`,
    allow_promotion_codes: true,
    locale: "nb",
    metadata: {
      household_id: householdId,
      plan: body.plan,
    },
    ...(isLifetime
      ? {}
      : {
          subscription_data: {
            trial_period_days: 14,
            metadata: {
              household_id: householdId,
              plan: body.plan,
            },
          },
        }),
  });

  return NextResponse.json({ url: session.url });
}
