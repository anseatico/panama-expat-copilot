"use client";

import { useState } from "react";
import { UploadZone } from "@/components/ui/upload-zone";
import { LeaseReport } from "@/components/lease-report";
import type { LeaseAudit } from "@/lib/ai-engine";

export default function HousingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LeaseAudit | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(form: FormData) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/audit-lease", { method: "POST", body: form });
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
        <h1 className="text-2xl font-bold">Auditoría de contrato de alquiler</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sube tu contrato (PDF, foto o texto) y la IA lo revisará contra la ley panameña de
          arrendamientos protegiendo tus intereses como inquilino.
        </p>
      </div>
      <UploadZone
        submitLabel="Auditar contrato"
        loading={loading}
        onSubmit={handleSubmit}
        textPlaceholder="…o pega aquí el texto del contrato"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && <LeaseReport audit={result} />}
    </div>
  );
}
