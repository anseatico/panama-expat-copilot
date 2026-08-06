import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, PLANS } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Falta firma" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id ?? session.client_reference_id;
      const planKey = (session.metadata?.plan ?? "onetime") as keyof typeof PLANS;
      if (userId) {
        const { data: profile } = await admin
          .from("profiles").select("credits").eq("id", userId).single();
        await admin
          .from("profiles")
          .update({
            plan: planKey,
            stripe_customer_id: (session.customer as string) ?? null,
            credits: (profile?.credits ?? 0) + PLANS[planKey].credits,
          })
          .eq("id", userId);
      }
      break;
    }
    case "invoice.paid": {
      // Renovación mensual: recargar créditos
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.billing_reason === "subscription_cycle" && invoice.customer) {
        await admin
          .from("profiles")
          .update({ credits: PLANS.monthly.credits })
          .eq("stripe_customer_id", invoice.customer as string);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await admin
        .from("profiles")
        .update({ plan: "free", credits: 0 })
        .eq("stripe_customer_id", sub.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
