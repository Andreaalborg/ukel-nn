import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe, getPlanFromPriceId } from "@/lib/stripe";
import type Stripe from "stripe";

/**
 * Stripe webhook handler.
 * Krever STRIPE_WEBHOOK_SECRET for å verifisere signaturen.
 *
 * Sett opp i Stripe Dashboard:
 *   Developers → Webhooks → Add endpoint
 *   URL: https://gjore.no/api/stripe/webhook
 *   Events: checkout.session.completed, customer.subscription.created,
 *           customer.subscription.updated, customer.subscription.deleted,
 *           invoice.payment_succeeded, invoice.payment_failed
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookSecret || !supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server-konfig mangler" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Mangler signatur" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Ukjent feil";
    return NextResponse.json({ error: `Signatur-verifisering feilet: ${msg}` }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Dedupliser: ikke prosesser samme event to ganger
  const { data: existing } = await admin
    .from("subscription_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const householdId = session.metadata?.household_id;
        const plan = session.metadata?.plan;
        if (!householdId) break;

        if (session.mode === "payment") {
          // Lifetime — engangskjøp
          await admin
            .from("households")
            .update({
              lifetime: true,
              plan: "lifetime",
              subscription_status: "active",
            })
            .eq("id", householdId);
        } else if (session.mode === "subscription" && session.subscription) {
          // Abonnement — vil oppdateres av customer.subscription.created også
          await admin
            .from("households")
            .update({
              stripe_subscription_id: session.subscription as string,
              plan: plan === "family_yearly" ? "family" : plan ?? "family",
              subscription_status: "trialing",
            })
            .eq("id", householdId);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price.id;
        const planKey = getPlanFromPriceId(priceId);

        await admin
          .from("households")
          .update({
            stripe_subscription_id: sub.id,
            stripe_price_id: priceId,
            subscription_status: sub.status,
            current_period_end: new Date(
              (sub as unknown as { current_period_end: number }).current_period_end * 1000
            ).toISOString(),
            plan: planKey === "lifetime" ? "lifetime" : "family",
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await admin
          .from("households")
          .update({
            subscription_status: "canceled",
            plan: "free",
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await admin
          .from("households")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await admin
          .from("households")
          .update({ subscription_status: "active" })
          .eq("stripe_customer_id", customerId);
        break;
      }
    }

    // Logg eventen (audit)
    const subObj = event.data.object as { metadata?: { household_id?: string }; customer?: string };
    const householdId = subObj?.metadata?.household_id ?? null;
    await admin.from("subscription_events").insert({
      household_id: householdId,
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event.data.object as object,
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Ukjent feil";
    console.error("[stripe webhook] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
