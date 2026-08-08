import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>Panama Expat Copilot</h1>
      <nav style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <Link href="/audit">Auditoría de Contratos</Link>
        <Link href="/jubilado">Verificador Ley 6</Link>
        <Link href="/medico">Dossier Médico</Link>
      </nav>
    </div>
  );
}
