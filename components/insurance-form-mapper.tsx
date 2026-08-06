"use client";

import { useState } from "react";
import { ClipboardList, Copy, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InsuranceMapping } from "@/lib/ai-engine";

function money(n: number | null, currency: string) {
  return n != null ? `${currency === "USD" ? "$" : currency + " "}${n.toFixed(2)}` : "—";
}

export function InsuranceFormMapper({ mapping }: { mapping: InsuranceMapping }) {
  const [copied, setCopied] = useState(false);

  const copyAll = () => {
    const text = mapping.mapped_fields
      .map((f) => `${f.field_label_en}: ${f.value}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {mapping.form_name}
            </CardTitle>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold uppercase text-primary">
              {mapping.insurer}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campos mapeados */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">
                Campos listos para copiar al formulario
              </span>
              <Button size="sm" variant="outline" onClick={copyAll}>
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado" : "Copiar todo"}
              </Button>
            </div>
            <div className="divide-y rounded-md border text-sm">
              {mapping.mapped_fields.map((f, i) => (
                <div key={i} className="grid grid-cols-[40%_60%] px-3 py-2">
                  <span className="pr-2 font-medium text-muted-foreground">{f.field_label_en}</span>
                  <span>{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Line items traducidos */}
          {mapping.line_items.length > 0 && (
            <div>
              <div className="mb-1 text-sm font-medium">Servicios traducidos (ES → EN)</div>
              <div className="divide-y rounded-md border text-sm">
                {mapping.line_items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div>
                      <div>{item.description_en}</div>
                      <div className="text-xs italic text-muted-foreground">{item.description_es}</div>
                    </div>
                    <span className="shrink-0 font-medium">{money(item.amount, mapping.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totales */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-md bg-muted p-3">
              <div className="text-muted-foreground">Subtotal</div>
              <div className="font-semibold">{money(mapping.totals.subtotal, mapping.currency)}</div>
            </div>
            <div className="rounded-md bg-muted p-3">
              <div className="text-muted-foreground">ITBMS</div>
              <div className="font-semibold">{money(mapping.totals.itbms_tax, mapping.currency)}</div>
            </div>
            <div className="rounded-md bg-muted p-3">
              <div className="text-muted-foreground">Total a reclamar</div>
              <div className="font-semibold">{money(mapping.totals.total, mapping.currency)}</div>
            </div>
          </div>

          {/* Información faltante */}
          {mapping.missing_info.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-amber-800">
                <AlertCircle className="h-4 w-4" />
                Completa manualmente antes de enviar
              </div>
              <ul className="list-inside list-disc text-amber-900">
                {mapping.missing_info.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm text-muted-foreground">{mapping.notes_en}</p>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        ⚠️ Verifica los datos contra tu factura original antes de enviar el reclamo. Los formularios
        oficiales pueden cambiar; descarga siempre la versión vigente del sitio de tu aseguradora.
      </p>
    </div>
  );
}
