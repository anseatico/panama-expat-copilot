"use client";

import { useState } from "react";
import { UploadZone } from "@/components/ui/upload-zone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MedicalDossier } from "@/lib/ai-engine";
import { cn } from "@/lib/utils";

export default function HealthPage() {
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "es">("es");
  const [result, setResult] = useState<MedicalDossier | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(form: FormData) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/translate-medical?lang=${lang}`, {
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
        <h1 className="text-2xl font-bold">Dossier médico bilingüe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sube recetas, laboratorios o informes médicos y obtén una traducción clínica precisa.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={lang === "en" ? "default" : "outline"}
          size="sm"
          onClick={() => setLang("en")}
        >
          Traducir a inglés
        </Button>
        <Button
          variant={lang === "es" ? "default" : "outline"}
          size="sm"
          onClick={() => setLang("es")}
        >
          Traducir a español
        </Button>
      </div>

      <UploadZone
        submitLabel="Traducir documento"
        loading={loading}
        onSubmit={handleSubmit}
        textPlaceholder="…o pega aquí el texto del documento médico"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Resumen <span className="text-sm font-normal text-muted-foreground">({result.tipo_documento})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>ES:</strong> {result.resumen_es}</p>
              <p><strong>EN:</strong> {result.resumen_en}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Traducción completa</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap font-sans text-sm">{result.traduccion_completa}</pre>
            </CardContent>
          </Card>

          {result.medicamentos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Medicamentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {result.medicamentos.map((m, i) => (
                  <div key={i} className="rounded-md bg-muted p-3">
                    <strong>{m.nombre}</strong>
                    {m.equivalente && <> — equivalente: {m.equivalente}</>}
                    {m.dosis && <div className="text-muted-foreground">Dosis: {m.dosis}</div>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.terminos_clave.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Términos clave</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {result.terminos_clave.map((t, i) => (
                  <div key={i}>
                    <strong>{t.original}</strong> → {t.traduccion}
                    <p className="text-muted-foreground">{t.explicacion}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.alertas.length > 0 && (
            <div className={cn("rounded-md border border-amber-200 bg-amber-50 p-4 text-sm")}>
              <strong>Alertas:</strong>
              <ul className="mt-1 list-inside list-disc">
                {result.alertas.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            ⚠️ Traducción generada por IA para referencia. No sustituye consejo médico ni
            traducción certificada oficial.
          </p>
        </div>
      )}
    </div>
  );
}
