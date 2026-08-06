import { NextResponse } from "next/server";
import { createCheckoutSession, PLANS } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { plan } = (await req.json()) as { plan: keyof typeof PLANS };
  if (!PLANS[plan]) return NextResponse.json({ error: "Plan inválido" }, { status: 400 });

  const session = await createCheckoutSession({
    plan,
    userId: user.id,
    email: user.email!,
  });
  return NextResponse.json({ url: session.url });
}
