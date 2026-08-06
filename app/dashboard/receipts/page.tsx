"use client";

import { useState } from "react";
import { UploadZone } from "@/components/ui/upload-zone";
import { ReceiptChecker } from "@/components/receipt-checker";
import type { ReceiptAudit } from "@/lib/ai-engine";

export default function ReceiptsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReceiptAudit | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(form: FormData) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/audit-receipt", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Verificador de descuentos de jubilado</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Toma una foto de tu factura y verifica si te aplicaron el descuento de la Ley 6 de 1987.
        </p>
      </div>
      <UploadZone
        accept="image/*,application/pdf"
        submitLabel="Verificar descuento"
        loading={loading}
        onSubmit={handleSubmit}
        textPlaceholder="…o describe el recibo (comercio, total, descuento aplicado)"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && <ReceiptChecker audit={result} />}
    </div>
  );
}
