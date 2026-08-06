import Link from "next/link";
import { FileSearch, Receipt, Stethoscope, ClipboardList, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const modules = [
  {
    icon: FileSearch,
    title: "Auditoría de contrato de alquiler",
    desc: "Sube tu contrato (PDF o foto) y recibe en 60 segundos un reporte de cláusulas de riesgo, depósitos abusivos y cumplimiento con la ley panameña.",
  },
  {
    icon: Receipt,
    title: "Verificador de descuentos de jubilado",
    desc: "Escanea cualquier factura y comprueba si te aplicaron correctamente los descuentos de la Ley 6 de 1987. Te decimos cuánto reclamar y cómo.",
  },
  {
    icon: Stethoscope,
    title: "Dossier médico bilingüe",
    desc: "Traduce recetas, laboratorios e informes médicos español↔inglés con terminología clínica precisa y equivalencias de medicamentos.",
  },
  {
    icon: ClipboardList,
    title: "Formularios de seguros",
    desc: "Convierte facturas clínicas panameñas en campos listos para los formularios de reembolso de Cigna, Bupa, Aetna y más.",
  },
];

export default function LandingPage() {
  return (
    <main>
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-primary">🇵🇦 Panama Expat Copilot</span>
          <Link href="/login">
            <Button variant="outline" size="sm">Iniciar sesión</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Tu copiloto de IA para vivir en Panamá sin sorpresas
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Contratos de alquiler, descuentos de jubilado y documentos médicos — analizados por IA
          entrenada en la ley panameña, en español e inglés.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/login">
            <Button size="lg">Auditar mi contrato — $49</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">Plan mensual — $29/mes</Button>
          </Link>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> Tus documentos se almacenan cifrados y solo tú puedes verlos.
        </p>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => (
            <Card key={m.title}>
              <CardHeader>
                <m.icon className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>{m.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Panama Expat Copilot · No constituye asesoría legal ni médica.
      </footer>
    </main>
  );
}
