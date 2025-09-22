import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";

import configFile from "@/config";
import { findCheckoutSession, getStripeClient } from "@/libs/stripe";
import { getServiceSupabaseClient } from "@/server/supabase";
import { recordObservabilityEvent } from "@/server/observability";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing Stripe webhook secret" }, { status: 500 });
  }

  let stripe: Stripe;
  try {
    stripe = getStripeClient();
  } catch (error) {
    console.error("[stripe][webhook] Stripe client initialisation failed", error);
    return NextResponse.json({ error: "Missing Stripe configuration" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe][webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let supabase: ReturnType<typeof getServiceSupabaseClient>;
  try {
    supabase = getServiceSupabaseClient();
  } catch (error) {
    console.error("[stripe][webhook] Supabase client initialisation failed", error);
    return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
  }

  const eventId = event.id;
  const serializedEvent = JSON.parse(JSON.stringify(event));

  const { data: existingEvent, error: lookupError } = await supabase
    .from("stripe_events")
    .select("id,status")
    .eq("event_id", eventId)
    .maybeSingle();

  if (lookupError && lookupError.code !== "PGRST116") {
    console.error("[stripe][webhook] Failed to lookup existing event", lookupError);
    return NextResponse.json({ error: "Event lookup failed" }, { status: 500 });
  }

  if (existingEvent) {
    void recordObservabilityEvent({
      source: "api.stripe-webhook",
      eventType: "stripe.event.duplicate",
      severity: "warning",
      context: { eventId, eventType: event.type },
    });
    return NextResponse.json({ received: true, duplicate: true });
  }

  const insertResult = await supabase
    .from("stripe_events")
    .insert({
      event_id: eventId,
      event_type: event.type,
      payload: serializedEvent,
    })
    .select("id")
    .single();

  if (insertResult.error) {
    void recordObservabilityEvent({
      source: "api.stripe-webhook",
      eventType: "stripe.event.persistence_failed",
      severity: "error",
      context: {
        eventId,
        eventType: event.type,
        message: insertResult.error.message,
      },
    });
    if ((insertResult.error as any)?.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[stripe][webhook] Failed to persist Stripe event", insertResult.error);
    return NextResponse.json({ error: "Event persistence failed" }, { status: 500 });
  }

  const eventRowId = insertResult.data?.id ?? null;
  let processingStatus: "processed" | "ignored" | "failed" = "ignored";

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const stripeObject: Stripe.Checkout.Session = event.data.object as Stripe.Checkout.Session;
        const session = await findCheckoutSession(stripeObject.id);

        const customerId = session?.customer;
        const priceId = session?.line_items?.data[0]?.price.id;
        const userId = stripeObject.client_reference_id;
        const plan = configFile.stripe.plans.find((p) => p.priceId === priceId);

        if (plan && customerId && userId) {
          await supabase
            .from("profiles")
            .update({
              customer_id: customerId,
              price_id: priceId,
              has_access: true,
            })
            .eq("id", userId);
        }

        processingStatus = "processed";
        break;
      }

      case "customer.subscription.deleted": {
        const stripeObject: Stripe.Subscription = event.data.object as Stripe.Subscription;
        const subscription = await stripe.subscriptions.retrieve(stripeObject.id);

        await supabase
          .from("profiles")
          .update({ has_access: false })
          .eq("customer_id", subscription.customer);

        processingStatus = "processed";
        break;
      }

      case "invoice.paid": {
        const stripeObject: Stripe.Invoice = event.data.object as Stripe.Invoice;
        const lineItem = stripeObject.lines.data[0];
        const priceId = (lineItem as any).price_id || (lineItem as any).price?.id || lineItem.metadata?.price_id;
        const customerId = stripeObject.customer;

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("customer_id", customerId)
          .maybeSingle();

        if (profile && profile.price_id === priceId) {
          await supabase
            .from("profiles")
            .update({ has_access: true })
            .eq("customer_id", customerId);
        }

        processingStatus = "processed";
        break;
      }

      case "checkout.session.expired":
      case "customer.subscription.updated":
      case "invoice.payment_failed": {
        processingStatus = "ignored";
        break;
      }

      default: {
        processingStatus = "ignored";
        break;
      }
    }
  } catch (error) {
    processingStatus = "failed";
    console.error("[stripe][webhook] Processing error", error);
    void recordObservabilityEvent({
      source: "api.stripe-webhook",
      eventType: "stripe.event.processing_failed",
      severity: "critical",
      context: {
        eventId,
        eventType: event.type,
        message: error instanceof Error ? error.message : String(error),
      },
    });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  } finally {
    if (eventRowId) {
      const { error: updateError } = await supabase
        .from("stripe_events")
        .update({
          processed_at: new Date().toISOString(),
          status: processingStatus,
        })
        .eq("id", eventRowId);

      if (updateError) {
        console.error("[stripe][webhook] Failed to update stripe_events", updateError);
      }
    }
  }

  return NextResponse.json({ received: true });
}
