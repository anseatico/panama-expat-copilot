import { NextResponse } from "next/server";
import { auditLease } from "@/lib/ai-engine";
import { requireUserWithCredit, parseDocInput, saveAnalysis } from "@/lib/api-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const auth = await requireUserWithCredit();
  if ("error" in auth) return auth.error;

  try {
    const doc = await parseDocInput(req);
    if (!doc.text && !doc.imageBase64 && !doc.pdfBase64) {
      return NextResponse.json({ error: "Adjunta el contrato (PDF, imagen o texto)" }, { status: 400 });
    }
    const result = await auditLease(doc);
    await saveAnalysis(auth.user.id, "housing", result);
    return NextResponse.json(result);
  } catch (e) {
    console.error("audit-lease:", e);
    return NextResponse.json({ error: "Error analizando el contrato" }, { status: 500 });
  }
}
