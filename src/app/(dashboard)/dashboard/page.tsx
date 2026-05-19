export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[#e8e8e8]">Dashboard</h1>
        <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
          Resumen general del sistema
        </p>
      </div>

      {/* KPI Grid — placeholder hasta conectar Supabase */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Cuentas Activas',      value: '—',  sub: 'conectar BD' },
          { label: 'Capital en Posición',  value: '—',  sub: 'conectar BD' },
          { label: 'Abonos Hoy',           value: '—',  sub: 'conectar BD' },
          { label: 'En Seguimiento',       value: '—',  sub: 'conectar BD' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0a0a0a] border border-[#1e1e1e] p-4">
            <div className="text-[7.5px] font-mono tracking-[1.5px] text-[#555] uppercase mb-2">
              {kpi.label}
            </div>
            <div className="text-2xl font-mono text-[#d4af37] leading-none mb-1">{kpi.value}</div>
            <div className="text-[8px] font-mono text-[#333]">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-6 text-center">
        <div className="text-[#555] text-xs font-mono tracking-wider">
          Conecta Supabase en .env.local para activar los datos
        </div>
      </div>
    </div>
  )
}
