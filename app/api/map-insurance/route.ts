import { NextResponse } from "next/server";
import { mapInsurance, INSURERS, type Insurer } from "@/lib/ai-engine";
import { requireUserWithCredit, parseDocInput, saveAnalysis } from "@/lib/api-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const auth = await requireUserWithCredit();
  if ("error" in auth) return auth.error;

  try {
    const url = new URL(req.url);
    const insurerParam = url.searchParams.get("insurer") ?? "other";
    const insurer: Insurer = (INSURERS as readonly string[]).includes(insurerParam)
      ? (insurerParam as Insurer)
      : "other";

    const doc = await parseDocInput(req);
    if (!doc.text && !doc.imageBase64 && !doc.pdfBase64) {
      return NextResponse.json({ error: "Adjunta la factura clínica o de farmacia" }, { status: 400 });
    }
    const result = await mapInsurance(doc, insurer);
    await saveAnalysis(auth.user.id, "insurance", result);
    return NextResponse.json(result);
  } catch (e) {
    console.error("map-insurance:", e);
    return NextResponse.json({ error: "Error procesando la factura" }, { status: 500 });
  }
}
