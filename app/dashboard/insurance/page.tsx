"use client";

import { useState } from "react";
import { UploadZone } from "@/components/ui/upload-zone";
import { InsuranceFormMapper } from "@/components/insurance-form-mapper";
import { Button } from "@/components/ui/button";
import type { InsuranceMapping, Insurer } from "@/lib/ai-engine";

const insurers: { id: Insurer; label: string }[] = [
  { id: "cigna", label: "Cigna Global" },
  { id: "bupa", label: "Bupa Global" },
  { id: "aetna", label: "Aetna International" },
  { id: "other", label: "Otra aseguradora" },
];

export default function InsurancePage() {
  const [loading, setLoading] = useState(false);
  const [insurer, setInsurer] = useState<Insurer>("cigna");
  const [result, setResult] = useState<InsuranceMapping | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(form: FormData) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/map-insurance?insurer=${insurer}`, {
        method: "POST",
        body: form,
      });
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
        <h1 className="text-2xl font-bold">Formularios de seguros</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sube tu factura clínica o de farmacia (en español) y te damos los campos listos para el
          formulario de reembolso de tu aseguradora internacional.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {insurers.map((ins) => (
          <Button
            key={ins.id}
            variant={insurer === ins.id ? "default" : "outline"}
            size="sm"
            onClick={() => setInsurer(ins.id)}
          >
            {ins.label}
          </Button>
        ))}
      </div>

      <UploadZone
        accept="image/*,application/pdf"
        submitLabel="Mapear al formulario"
        loading={loading}
        onSubmit={handleSubmit}
        textPlaceholder="…o pega aquí el detalle de la factura"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && <InsuranceFormMapper mapping={result} />}
    </div>
  );
}
