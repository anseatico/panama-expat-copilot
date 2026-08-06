import { NextResponse } from "next/server";
import { translateMedical } from "@/lib/ai-engine";
import { requireUserWithCredit, parseDocInput, saveAnalysis } from "@/lib/api-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const auth = await requireUserWithCredit();
  if ("error" in auth) return auth.error;

  try {
    const url = new URL(req.url);
    const lang = url.searchParams.get("lang") === "en" ? "en" : "es";
    const doc = await parseDocInput(req);
    if (!doc.text && !doc.imageBase64 && !doc.pdfBase64) {
      return NextResponse.json({ error: "Adjunta el documento médico" }, { status: 400 });
    }
    const result = await translateMedical(doc, lang);
    await saveAnalysis(auth.user.id, "health", result);
    return NextResponse.json(result);
  } catch (e) {
    console.error("translate-medical:", e);
    return NextResponse.json({ error: "Error procesando el documento" }, { status: 500 });
  }
}
