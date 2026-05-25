import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

/**
 * Oppretter en Stripe Customer Portal-session.
 * Brukeren får selv håndtere abonnement, betalingsmetode, fakturaer, oppsigelse.
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

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userErr } = await admin.auth.getUser(accessToken);
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "Ugyldig sesjon" }, { status: 401 });
  }

  const { data: members } = await admin
    .from("household_members")
    .select("household_id")
    .eq("user_id", userData.user.id)
    .limit(1);

  if (!members || members.length === 0) {
    return NextResponse.json({ error: "Ingen husholdning" }, { status: 400 });
  }

  const { data: household } = await admin
    .from("households")
    .select("stripe_customer_id")
    .eq("id", members[0].household_id)
    .single();

  if (!household?.stripe_customer_id) {
    return NextResponse.json(
      { error: "Ingen abonnement ennå — bruk Oppgrader-knappen først" },
      { status: 400 }
    );
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: household.stripe_customer_id,
    return_url: `${origin}/forelder/innstillinger`,
  });

  return NextResponse.json({ url: session.url });
}
