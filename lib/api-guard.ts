import { NextResponse } from "next/server";
import { supabaseAdmin, createClientSupabase } from "@/lib/supabase";
import type { DocInput } from "@/lib/ai-engine";
import type { User } from "@supabase/supabase-js";

/** Autentica al usuario y consume 1 crédito. Devuelve error HTTP listo si falla. */
export async function requireUserWithCredit(): Promise<
  { user: User } | { error: NextResponse }
> {
  const supabase = createClientSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  const admin = supabaseAdmin;
  const { data: ok } = await admin.rpc("consume_credit", { p_user_id: user.id });
  if (!ok) {
    return {
      error: NextResponse.json(
        { error: "Sin créditos. Compra una auditoría o suscríbete." },
        { status: 402 }
      ),
    };
  }
  return { user };
}

/** Extrae el documento de un FormData (file o texto pegado). */
export async function parseDocInput(req: Request): Promise<DocInput> {
  const form = await req.formData();
  const text = form.get("text");
  const file = form.get("file");
  const doc: DocInput = {};
  if (typeof text === "string" && text.trim()) doc.text = text.trim();
  if (file instanceof File) {
    const buf = Buffer.from(await file.arrayBuffer()).toString("base64");
    if (file.type === "application/pdf") {
      doc.pdfBase64 = buf;
    } else if (file.type.startsWith("image/")) {
      doc.imageBase64 = buf;
      doc.imageMediaType = file.type as NonNullable<DocInput["imageMediaType"]>;
    } else {
      doc.text = (doc.text ?? "") + Buffer.from(buf, "base64").toString("utf-8");
    }
  }
  return doc;
}

/** Guarda el resultado del análisis (fire-and-forget seguro). */
export async function saveAnalysis(
  userId: string,
  module: "housing" | "receipts" | "health" | "insurance",
  result: unknown
) {
  const admin = supabaseAdmin;
  await admin.from("analyses").insert({
    user_id: userId,
    module,
    result,
    model: "claude-3-5-sonnet-latest",
  });
}
