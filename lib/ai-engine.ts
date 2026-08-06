import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/**
 * Motor de IA — Claude (Anthropic) con visión para OCR de documentos.
 * System prompts según especificación oficial (Sección 4 del documento de producto).
 */

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-3-5-sonnet-latest";

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export interface DocInput {
  /** Texto plano del documento (si ya fue extraído). */
  text?: string;
  /** Imagen/scan en base64 (OCR vía visión). */
  imageBase64?: string;
  imageMediaType?: ImageMediaType;
  /** PDF en base64 (soporte nativo de Anthropic). */
  pdfBase64?: string;
}

function buildUserContent(doc: DocInput, instruction: string): Anthropic.MessageParam["content"] {
  const content: Anthropic.Messages.ContentBlockParam[] = [];
  if (doc.pdfBase64) {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: doc.pdfBase64 },
    });
  }
  if (doc.imageBase64) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: doc.imageMediaType ?? "image/jpeg",
        data: doc.imageBase64,
      },
    });
  }
  if (doc.text) {
    content.push({ type: "text", text: `--- DOCUMENT ---\n${doc.text}\n--- END ---` });
  }
  content.push({ type: "text", text: instruction });
  return content;
}

async function callClaudeJSON<T>(params: {
  system: string;
  doc: DocInput;
  instruction: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: params.maxTokens ?? 4096,
    system: params.system,
    messages: [{ role: "user", content: buildUserContent(params.doc, params.instruction) }],
  });
  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("La IA no devolvió JSON válido");
  return params.schema.parse(JSON.parse(jsonMatch[0]));
}

/* ============================================================
 * MÓDULO A — Housing Lease Auditor
 * System Prompt 1 (spec oficial): informe en inglés,
 * enmiendas de contraoferta en español.
 * ============================================================ */

export const LeaseAuditSchema = z.object({
  risk_score: z.enum(["LOW", "MEDIUM", "HIGH"]),
  summary: z.string(),
  red_flags: z.array(
    z.object({
      clause_number: z.string(),
      original_text_es: z.string(),
      issue_description_en: z.string(),
      severity: z.enum(["CRITICAL", "WARNING"]),
      suggested_amendment_es: z.string(),
    })
  ),
  price_analysis: z.object({
    estimated_market_range: z.string(),
    recommendation: z.string(),
  }),
});
export type LeaseAudit = z.infer<typeof LeaseAuditSchema>;

const LEASE_SYSTEM = `You are an expert Panamanian real estate legal auditor assisting foreign expats who are moving to Panama.
Your job is to analyze lease agreements written in Spanish and provide a clear, comprehensive audit in English.

Legal Framework to Reference:
- Panama Lease Law 93 of October 4, 1973 (and updates).
- Standard market practices in Panama (Boquete, Coronado, Panama City, El Valle).

Your Analysis MUST check for:
1. Deposit terms: Security deposit must not exceed one month's rent and should ideally be registered with MIVIOT or explicitly regulated for return within 30 days post-lease.
2. Maintenance & Repairs: Landlord is responsible for structural repairs and major appliance failures not caused by tenant negligence. Watch out for clauses forcing tenants to cover major air conditioner replacements or roof repairs.
3. Escalation Clauses: Unreasonable annual rent percentage increases.
4. Termination & Penalties: Excessive penalties for early diplomatic or health-related relocation.
5. Currency & Utility terms: Clear designation of water, maintenance fees (HOA/mantenimiento), gas, and electricity responsibility.

Output Format: Provide response strictly in JSON matching this schema:
{
"risk_score": "LOW" | "MEDIUM" | "HIGH",
"summary": "String",
"red_flags": [
{
"clause_number": "String",
"original_text_es": "String",
"issue_description_en": "String",
"severity": "CRITICAL" | "WARNING",
"suggested_amendment_es": "String"
}
],
"price_analysis": {
"estimated_market_range": "String",
"recommendation": "String"
}
}`;

export async function auditLease(doc: DocInput): Promise<LeaseAudit> {
  return callClaudeJSON({
    system: LEASE_SYSTEM,
    doc,
    schema: LeaseAuditSchema,
    instruction:
      "Audit the attached lease agreement. Respond ONLY with the JSON object defined in your instructions — no markdown, no commentary. The suggested_amendment_es fields must contain exact Spanish wording the tenant can send to the landlord or real estate agent. In price_analysis, compare the quoted rent against typical market value per m² for the property's zone.",
  });
}

/* ============================================================
 * SUB-MÓDULO B3 — Panama Senior Discount Auditor
 * System Prompt 2 (spec oficial): Ley 6 de 1987 + carta
 * de reclamo bilingüe EN/ES.
 * ============================================================ */

export const ReceiptAuditSchema = z.object({
  merchant_name: z.string(),
  category: z.string(),
  date: z.string().nullable(),
  total_paid: z.number().nullable(),
  items: z.array(
    z.object({
      description: z.string(),
      amount: z.number().nullable(),
    })
  ),
  legal_discount_pct: z.number().nullable(),
  discount_applied: z.boolean(),
  discount_amount_found: z.number().nullable(),
  amount_owed: z.number().nullable(),
  verdict: z.enum(["correct", "missing_discount", "partial_discount", "not_applicable"]),
  explanation_en: z.string(),
  claim_letter_en: z.string(),
  claim_letter_es: z.string(),
});
export type ReceiptAudit = z.infer<typeof ReceiptAuditSchema>;

const RECEIPT_SYSTEM = `You are an automated invoice auditor ensuring foreign expats holding the "Pensionado" status receive their mandatory discounts in Panama.

Regulatory Rules (Ley 6 de 1987):
- Medical Consultations: 20% discount
- Hospital/Surgery Services: 15% discount
- Prescription Drugs: 10% discount
- Dental/Optometry: 15% discount
- Restaurants: 25% (full meals), 15% (fast food)
- Hotels/Lodging: 50% (Mon-Thu), 30% (Fri-Sun)
- Entertainment/Movie Theaters: 50% discount

Tasks:
1. Parse the uploaded receipt/invoice image (OCR).
2. Extract Merchant Name, Category, Date, Total Paid, and items breakdown.
3. Determine if the senior discount was applied.
4. If missing, calculate the exact amount owed back to the customer and draft a polite bilingual letter (EN/ES) requesting the adjustment.

Respond ONLY with valid JSON.`;

export async function auditReceipt(doc: DocInput): Promise<ReceiptAudit> {
  return callClaudeJSON({
    system: RECEIPT_SYSTEM,
    doc,
    schema: ReceiptAuditSchema,
    instruction: `Audit this receipt/invoice. Respond ONLY with this JSON structure — no markdown, no commentary:
{
  "merchant_name": "string",
  "category": "medical_consultation|hospital|prescription_drugs|dental_optometry|restaurant|fast_food|hotel|entertainment|other",
  "date": "YYYY-MM-DD"|null,
  "total_paid": number|null,
  "items": [{"description": "string", "amount": number|null}],
  "legal_discount_pct": number|null (mandatory % per Ley 6 de 1987 for this category),
  "discount_applied": boolean,
  "discount_amount_found": number|null (discount amount detected on the receipt, if any),
  "amount_owed": number|null (exact USD amount owed back to the customer),
  "verdict": "correct|missing_discount|partial_discount|not_applicable",
  "explanation_en": "string (plain-English explanation of the calculation)",
  "claim_letter_en": "polite adjustment-request letter in English (empty string if verdict is correct or not_applicable)",
  "claim_letter_es": "same letter in Spanish (empty string if verdict is correct or not_applicable)"
}`,
  });
}

/* ============================================================
 * SUB-MÓDULO B2 — Formularios de Seguros
 * Facturas clínicas/farmacéuticas de Panamá (español) →
 * campos mapeados para formularios de reembolso de
 * Cigna, Bupa, Aetna, etc.
 * ============================================================ */

export const INSURERS = ["cigna", "bupa", "aetna", "other"] as const;
export type Insurer = (typeof INSURERS)[number];

export const InsuranceMappingSchema = z.object({
  insurer: z.string(),
  form_name: z.string(),
  provider: z.object({
    name: z.string(),
    ruc: z.string().nullable(),
    address: z.string().nullable(),
    phone: z.string().nullable(),
  }),
  patient_name: z.string().nullable(),
  service: z.object({
    date: z.string().nullable(),
    category: z.string(),
    diagnosis: z.string().nullable(),
  }),
  line_items: z.array(
    z.object({
      description_es: z.string(),
      description_en: z.string(),
      amount: z.number().nullable(),
    })
  ),
  totals: z.object({
    subtotal: z.number().nullable(),
    itbms_tax: z.number().nullable(),
    total: z.number().nullable(),
  }),
  currency: z.string(),
  mapped_fields: z.array(
    z.object({
      field_label_en: z.string(),
      value: z.string(),
    })
  ),
  missing_info: z.array(z.string()),
  notes_en: z.string(),
});
export type InsuranceMapping = z.infer<typeof InsuranceMappingSchema>;

const INSURANCE_SYSTEM = `You are an expert medical billing assistant helping foreign expats in Panama file reimbursement claims with international health insurers (Cigna Global, Bupa Global, Aetna International, and others).
You receive clinic, hospital, or pharmacy invoices issued in Panama (in Spanish). Your tasks:
1. Parse the invoice (OCR if image/PDF): provider name, RUC (Panamanian tax ID), address, phone, patient name, date of service, itemized services/products with amounts, ITBMS tax, and total.
2. Translate each line item into standard English medical billing terminology that insurance claim reviewers recognize.
3. Map the extracted data onto the fields of the selected insurer's standard reimbursement/claim form (e.g., Cigna Global "Claim Form", Bupa Global "Claim and refund form", Aetna International "Claim Reimbursement Form"). Use the typical field names of that insurer's form: patient/member name, provider details, country of treatment (Panama), currency (USD), date of service, diagnosis (only if stated on the invoice), treatment description, amount claimed.
4. List any information the form requires but the invoice does not contain (member ID, diagnosis code, proof of payment, etc.) so the patient can complete it manually.
NEVER invent clinical or personal data — if a value is not on the invoice, leave it null or list it under missing_info. Respond ONLY with valid JSON.`;

export async function mapInsurance(doc: DocInput, insurer: Insurer): Promise<InsuranceMapping> {
  return callClaudeJSON({
    system: INSURANCE_SYSTEM,
    doc,
    schema: InsuranceMappingSchema,
    instruction: `Map this Panamanian medical/pharmacy invoice to a reimbursement claim for insurer: ${insurer.toUpperCase()}. Respond ONLY with this JSON structure — no markdown, no commentary:
{
  "insurer": "${insurer}",
  "form_name": "official name of that insurer's claim form",
  "provider": {"name": "string", "ruc": "string|null", "address": "string|null", "phone": "string|null"},
  "patient_name": "string|null",
  "service": {"date": "YYYY-MM-DD"|null, "category": "consultation|hospital|pharmacy|laboratory|imaging|dental|other", "diagnosis": "string|null (only if stated)"},
  "line_items": [{"description_es": "string", "description_en": "string", "amount": number|null}],
  "totals": {"subtotal": number|null, "itbms_tax": number|null, "total": number|null},
  "currency": "USD",
  "mapped_fields": [{"field_label_en": "exact field name on the insurer's form", "value": "what to write in it"}],
  "missing_info": ["required data not present on the invoice"],
  "notes_en": "brief guidance for submitting this claim"
}`,
  });
}

/* ============================================================
 * SUB-MÓDULO B1 — Dossier Médico Unificado
 * Informes EE.UU./Canadá (inglés) → resumen estructurado en
 * español apto para médicos locales (Punta Pacífica, Paitilla).
 * ============================================================ */

export const MedicalDossierSchema = z.object({
  tipo_documento: z.string(),
  resumen_es: z.string(),
  resumen_en: z.string(),
  traduccion_completa: z.string(),
  terminos_clave: z.array(
    z.object({ original: z.string(), traduccion: z.string(), explicacion: z.string() })
  ),
  medicamentos: z.array(
    z.object({
      nombre: z.string(),
      equivalente: z.string().nullable(),
      dosis: z.string().nullable(),
    })
  ),
  alertas: z.array(z.string()),
});
export type MedicalDossier = z.infer<typeof MedicalDossierSchema>;

const MEDICAL_SYSTEM = `Eres un traductor médico certificado inglés<->español especializado en preparar dossiers clínicos para pacientes expatriados en Panamá.
Caso principal: informes y exámenes de EE.UU./Canadá (en inglés) que deben convertirse en un resumen médico estructurado en español, apto para presentar a médicos locales en Ciudad de Panamá (Punta Pacífica, Paitilla, San Fernando).
Traduces con precisión terminología clínica, resultados de laboratorio, recetas y diagnósticos. Señalas equivalencias de medicamentos (nombre comercial US vs. disponible en Panamá). NUNCA inventas datos clínicos; si algo es ilegible, indícalo en "alertas". No das diagnósticos ni consejo médico. Responde ÚNICAMENTE con JSON válido.`;

export async function translateMedical(
  doc: DocInput,
  targetLang: "en" | "es" = "es"
): Promise<MedicalDossier> {
  return callClaudeJSON({
    system: MEDICAL_SYSTEM,
    doc,
    schema: MedicalDossierSchema,
    instruction: `Procesa este documento médico. Idioma destino de la traducción completa: ${targetLang === "en" ? "inglés" : "español"}. Responde SOLO con este JSON:
{
  "tipo_documento": "receta|laboratorio|informe|otro",
  "resumen_es": "resumen estructurado en español apto para un médico local (motivo, antecedentes, hallazgos, medicación actual)",
  "resumen_en": "summary in English (2-3 sentences)",
  "traduccion_completa": "traducción fiel del documento completo",
  "terminos_clave": [{"original": "string", "traduccion": "string", "explicacion": "en lenguaje simple"}],
  "medicamentos": [{"nombre": "string", "equivalente": "string|null", "dosis": "string|null"}],
  "alertas": ["partes ilegibles o datos a verificar"]
}`,
    maxTokens: 8192,
  });
}
