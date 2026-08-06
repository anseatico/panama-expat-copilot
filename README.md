# 🇵🇦 Panama Expat Copilot — MVP

SaaS serverless para expats en Panamá. Tres módulos IA: auditoría de contratos de alquiler, verificador de descuentos de jubilado (Ley 6 de 1987) y dossier médico bilingüe.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind + Shadcn-style UI · Supabase (Auth, Postgres+RLS, Storage, pgvector) · Claude 3.5 Sonnet (visión/OCR) · Stripe · Vercel.

## Setup (15 min)

1. **Clonar e instalar**
   ```bash
   npm install
   cp .env.example .env.local
   ```

2. **Supabase**
   - Crea un proyecto en [supabase.com](https://supabase.com) (tier gratuito).
   - Ejecuta `supabase/schema.sql` en el SQL Editor (crea tablas, RLS, trigger de perfiles, bucket de Storage y función `consume_credit`).
   - Copia URL + anon key + service role key a `.env.local`.
   - En Auth → habilita Email (magic link).

3. **Anthropic**
   - API key en [console.anthropic.com](https://console.anthropic.com) → `ANTHROPIC_API_KEY`.

4. **Stripe**
   - Crea 2 productos: "Auditoría única" ($49, one-time) y "Plan mensual" ($29/mes, recurring). Copia los `price_...` a `.env.local`.
   - Webhook: endpoint `https://TU-DOMINIO/api/stripe-webhook`, eventos `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`. Copia el `whsec_...`.
   - Local: `stripe listen --forward-to localhost:3000/api/stripe-webhook`

5. **Correr**
   ```bash
   npm run dev
   ```

6. **Deploy en Vercel**
   - `vercel` o conecta el repo en GitHub. Añade todas las variables de entorno. Sin costo fijo.

## Arquitectura

```
Usuario → Vercel (Next.js)
  ├── /api/audit-lease       → Claude 3.5 Sonnet (PDF/visión) → JSON estructurado (Zod)
  ├── /api/audit-receipt     → Claude visión + reglas Ley 6/1987
  ├── /api/translate-medical → Claude traducción clínica ES↔EN
  ├── /api/checkout          → Stripe Checkout
  └── /api/stripe-webhook    → acredita créditos en Supabase (service role)
Supabase: Auth (magic link) · profiles/documents/analyses (RLS) · Storage privado · pgvector (RAG futuro)
```

**Modelo de créditos:** compra única = 1 crédito; suscripción mensual = 30 créditos/mes (recargados vía webhook `invoice.paid`). Cada llamada IA consume 1 crédito de forma atómica (`consume_credit`).

## Roadmap post-MVP

- RAG sobre `knowledge_chunks` (textos completos de Ley 93/1973 y Ley 6/1987) para citas legales exactas.
- Persistir adjuntos en Storage y historial de análisis en el dashboard.
- i18n completo (EN/ES) con `next-intl`.
- Panel B2B para agencias de reubicación (multi-cliente).

> ⚠️ Los análisis generados son orientación preliminar por IA; no constituyen asesoría legal ni médica.
