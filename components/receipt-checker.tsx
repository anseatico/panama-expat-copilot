"use client";

import { useState } from "react";
import { BadgeCheck, BadgeX, BadgeAlert, Ban, Copy, Check, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ReceiptAudit } from "@/lib/ai-engine";
import { cn } from "@/lib/utils";

const verdictConfig = {
  correct: {
    icon: BadgeCheck,
    label: "Descuento aplicado correctamente",
    cls: "bg-green-50 text-green-700 border-green-200",
  },
  partial_discount: {
    icon: BadgeAlert,
    label: "Descuento parcial — te deben la diferencia",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  missing_discount: {
    icon: BadgeX,
    label: "No aplicaron el descuento de pensionado",
    cls: "bg-red-50 text-red-700 border-red-200",
  },
  not_applicable: {
    icon: Ban,
    label: "La Ley 6 de 1987 no aplica a este recibo",
    cls: "bg-muted text-muted-foreground border-border",
  },
} as const;

function money(n: number | null) {
  return n != null ? `$${n.toFixed(2)}` : "—";
}

function ClaimLetter({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-md border p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <Mail className="h-4 w-4 text-primary" /> {title}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiada" : "Copiar carta"}
        </Button>
      </div>
      <pre className="whitespace-pre-wrap font-sans text-sm">{text}</pre>
    </div>
  );
}

export function ReceiptChecker({ audit }: { audit: ReceiptAudit }) {
  const v = verdictConfig[audit.verdict];
  const Icon = v.icon;
  const hasClaim =
    (audit.verdict === "missing_discount" || audit.verdict === "partial_discount") &&
    (audit.claim_letter_en || audit.claim_letter_es);

  return (
    <div className="space-y-4">
      {/* Veredicto */}
      <div className={cn("flex items-center gap-3 rounded-lg border p-4", v.cls)}>
        <Icon className="h-8 w-8 shrink-0" />
        <div>
          <div className="font-semibold">{v.label}</div>
          <div className="text-sm opacity-80">
            {audit.merchant_name} {audit.date ? `· ${audit.date}` : ""} · {audit.category}
          </div>
        </div>
        {audit.amount_owed != null && audit.amount_owed > 0 && (
          <div className="ml-auto text-right">
            <div className="text-2xl font-bold">{money(audit.amount_owed)}</div>
            <div className="text-xs">te deben devolver</div>
          </div>
        )}
      </div>

      {/* Cálculo */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle del cálculo (Ley 6 de 1987)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-md bg-muted p-3">
              <div className="text-muted-foreground">Total pagado</div>
              <div className="font-semibold">{money(audit.total_paid)}</div>
            </div>
            <div className="rounded-md bg-muted p-3">
              <div className="text-muted-foreground">% legal</div>
              <div className="font-semibold">
                {audit.legal_discount_pct != null ? `${audit.legal_discount_pct}%` : "—"}
              </div>
            </div>
            <div className="rounded-md bg-muted p-3">
              <div className="text-muted-foreground">Descuento detectado</div>
              <div className="font-semibold">{money(audit.discount_amount_found)}</div>
            </div>
            <div className="rounded-md bg-muted p-3">
              <div className="text-muted-foreground">Monto a reclamar</div>
              <div className="font-semibold">{money(audit.amount_owed)}</div>
            </div>
          </div>

          {audit.items.length > 0 && (
            <div>
              <div className="mb-1 text-sm font-medium">Desglose de items</div>
              <div className="divide-y rounded-md border text-sm">
                {audit.items.map((item, i) => (
                  <div key={i} className="flex justify-between px-3 py-2">
                    <span>{item.description}</span>
                    <span className="font-medium">{money(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm">{audit.explanation_en}</p>
        </CardContent>
      </Card>

      {/* Cartas de reclamo bilingües */}
      {hasClaim && (
        <Card>
          <CardHeader>
            <CardTitle>Carta de reclamo lista para enviar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {audit.claim_letter_es && <ClaimLetter title="Español" text={audit.claim_letter_es} />}
            {audit.claim_letter_en && <ClaimLetter title="English" text={audit.claim_letter_en} />}
            <p className="text-xs text-muted-foreground">
              Preséntala en el comercio; si no corrigen, puedes escalar el reclamo ante ACODECO.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
