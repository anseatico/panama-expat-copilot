import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PLANS = {
  onetime: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ONETIME!,
    mode: "payment" as const,
    credits: 1, // 1 auditoría completa
  },
  monthly: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!,
    mode: "subscription" as const,
    credits: 30, // usos/mes
  },
};

export async function createCheckoutSession(params: {
  plan: keyof typeof PLANS;
  userId: string;
  email: string;
}) {
  const plan = PLANS[params.plan];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  return stripe.checkout.sessions.create({
    mode: plan.mode,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    customer_email: params.email,
    client_reference_id: params.userId,
    metadata: { user_id: params.userId, plan: params.plan },
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/?checkout=cancelled`,
  });
}

export async function createPortalSession(customerId: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });
}
