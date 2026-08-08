import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Panama Expat Copilot</h1>
      <p>SaaS serverless para expats en Panamá. Selecciona un módulo:</p>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
        <Link href="/audit" style={{ padding: "15px", background: "#f0f0f0", borderRadius: "8px", textDecoration: "none", color: "#333", fontWeight: "bold" }}>
          📄 Auditoría de Contratos de Alquiler
        </Link>
        <Link href="/jubilado" style={{ padding: "15px", background: "#f0f0f0", borderRadius: "8px", textDecoration: "none", color: "#333", fontWeight: "bold" }}>
          ⚖️ Verificador Ley 6 (Jubilado)
        </Link>
        <Link href="/medico" style={{ padding: "15px", background: "#f0f0f0", borderRadius: "8px", textDecoration: "none", color: "#333", fontWeight: "bold" }}>
          🏥 Dossier Médico Bilingüe
        </Link>
      </nav>
    </div>
  );
}
