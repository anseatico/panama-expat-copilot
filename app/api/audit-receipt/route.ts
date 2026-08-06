import { NextResponse } from "next/server";
import { auditReceipt } from "@/lib/ai-engine";
import { requireUserWithCredit, parseDocInput, saveAnalysis } from "@/lib/api-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const auth = await requireUserWithCredit();
  if ("error" in auth) return auth.error;

  try {
    const doc = await parseDocInput(req);
    if (!doc.text && !doc.imageBase64 && !doc.pdfBase64) {
      return NextResponse.json({ error: "Adjunta el recibo (foto o PDF)" }, { status: 400 });
    }
    const result = await auditReceipt(doc);
    await saveAnalysis(auth.user.id, "receipts", result);
    return NextResponse.json(result);
  } catch (e) {
    console.error("audit-receipt:", e);
    return NextResponse.json({ error: "Error analizando el recibo" }, { status: 500 });
  }
}
