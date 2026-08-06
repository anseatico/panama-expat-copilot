import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panama Expat Copilot",
  description:
    "IA para expats en Panamá: audita tu contrato de alquiler, reclama tus descuentos de jubilado y traduce tu dossier médico.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
