import { prisma } from '@/lib/prisma'
import { getSessionCtx, plazaCuentaFilter } from '@/lib/session-context'
import PrintButton from './PrintButton'
import PlazaFilter from '@/components/PlazaFilter'

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ plaza?: string }>
}) {
  const { plaza: plazaFilter = '' } = await searchParams
  const ctx    = await getSessionCtx()
  const tenant = ctx?.tenant ?? await prisma.tenant.findFirst()

  const activeFilter = ctx?.isGestor
    ? plazaCuentaFilter(ctx)
    : plazaFilter
      ? { cliente: { plazaId: plazaFilter } }
      : {}

  const todasPlazas = !ctx?.isGestor && tenant
    ? await prisma.plaza.findMany({
        where: { tenantId: tenant.id },
        select: { id: true, nombre: true, ciudad: true },
        orderBy: { nombre: 'asc' },
      })
    : []

  const cuentas = tenant
    ? await prisma.cuenta.findMany({
        where: {
          tenantId: tenant.id,
          ...activeFilter,
        },
        include: {
          cliente: { include: { plaza: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const fmt = (n: number) => n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  // Agrupar por titular
  const byTitular = new Map<string, {
    nombre: string
    activas: number
    capitalTotal: number
    abonadoTotal: number
    saldoTotal: number
  }>()

  for (const c of cuentas) {
    const key = c.clienteId
    const existing = byTitular.get(key) ?? {
      nombre: c.cliente.nombre,
      activas: 0, capitalTotal: 0, abonadoTotal: 0, saldoTotal: 0,
    }
    if (c.estado === 'ACTIVA') existing.activas++
    existing.capitalTotal  += Number(c.assigned_capital)
    existing.abonadoTotal  += Number(c.total_abonado)
    existing.saldoTotal    += Number(c.remaining_balance)
    byTitular.set(key, existing)
  }

  // Agrupar por plaza — solo para ADMIN
  const byPlaza = new Map<string, {
    nombre: string
    titulares: Set<string>
    activas: number
    capitalTotal: number
    saldoTotal: number
  }>()

  if (!ctx?.isGestor) {
    for (const c of cuentas) {
      const key = c.cliente.plazaId
      const existing = byPlaza.get(key) ?? {
        nombre: c.cliente.plaza.nombre,
        titulares: new Set(),
        activas: 0, capitalTotal: 0, saldoTotal: 0,
      }
      existing.titulares.add(c.clienteId)
      if (c.estado === 'ACTIVA') existing.activas++
      existing.capitalTotal += Number(c.assigned_capital)
      existing.saldoTotal   += Number(c.remaining_balance)
      byPlaza.set(key, existing)
    }
  }

  const titularesList = Array.from(byTitular.values())
  const plazasList    = Array.from(byPlaza.values())

  const totalCapital = cuentas.filter(c => c.estado !== 'CERRADA').reduce((s, c) => s + Number(c.assigned_capital), 0)
  const totalAbonado = cuentas.reduce((s, c) => s + Number(c.total_abonado), 0)
  const totalSaldo   = cuentas.filter(c => c.estado !== 'CERRADA').reduce((s, c) => s + Number(c.remaining_balance), 0)
  const totalActivas = cuentas.filter(c => c.estado === 'ACTIVA').length

  const today = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="p-6 max-w-4xl" id="reporte-print">
      <div className="flex items-start justify-between mb-6 print:mb-4">
        <div>
          <h1 className="font-serif text-2xl text-[#e8e8e8]">Reportes</h1>
          <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
            Corte al {today}
            {ctx?.isGestor
              ? ' — Tu plaza'
              : plazaFilter && todasPlazas.find(p => p.id === plazaFilter)
                ? ` — ${todasPlazas.find(p => p.id === plazaFilter)!.nombre}`
                : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          {!ctx?.isGestor && todasPlazas.length > 1 && (
            <PlazaFilter plazas={todasPlazas} selected={plazaFilter} />
          )}
          <PrintButton />
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Cuentas Activas',     value: String(totalActivas),    color: 'text-[#d4af37]' },
          { label: 'Capital en Posición', value: `$${fmt(totalCapital)}`, color: 'text-[#d4af37]' },
          { label: 'Total Abonado',       value: `$${fmt(totalAbonado)}`, color: 'text-[#27ae60]' },
          { label: 'Saldo Pendiente',     value: `$${fmt(totalSaldo)}`,   color: 'text-[#e8e8e8]' },
        ].map(k => (
          <div key={k.label} className="border border-[#1e1e1e] bg-[#0a0a0a] p-4">
            <div className="text-[7.5px] font-mono tracking-[1.5px] text-[#555] uppercase mb-2">{k.label}</div>
            <div className={`text-lg font-mono leading-none ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Por Titular */}
      <div className={!ctx?.isGestor ? 'mb-8' : ''}>
        <div className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-3">Por Titular</div>
        <div className="border border-[#1e1e1e] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
                {['Titular', 'Activas', 'Capital asignado', 'Total abonado', 'Saldo'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[8px] font-mono tracking-[2px] text-[#555] uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {titularesList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#333] text-xs font-mono">Sin datos</td>
                </tr>
              ) : titularesList.map((t, i) => (
                <tr key={t.nombre} className={`border-b border-[#111] ${i % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#0a0a0a]'}`}>
                  <td className="px-4 py-3 text-[12px] text-[#e8e8e8]">{t.nombre}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#d4af37]">{t.activas}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#888]">${fmt(t.capitalTotal)}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#27ae60]">${fmt(t.abonadoTotal)}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#e8e8e8]">${fmt(t.saldoTotal)}</td>
                </tr>
              ))}
            </tbody>
            {titularesList.length > 1 && (
              <tfoot>
                <tr className="border-t border-[#2a2a2a] bg-[#0a0a0a]">
                  <td className="px-4 py-2 text-[9px] font-mono text-[#555] uppercase tracking-wider">Total</td>
                  <td className="px-4 py-2 text-[11px] font-mono text-[#d4af37]">{totalActivas}</td>
                  <td className="px-4 py-2 text-[11px] font-mono text-[#888]">${fmt(totalCapital)}</td>
                  <td className="px-4 py-2 text-[11px] font-mono text-[#27ae60]">${fmt(totalAbonado)}</td>
                  <td className="px-4 py-2 text-[11px] font-mono text-[#e8e8e8]">${fmt(totalSaldo)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Por Plaza — solo ADMIN */}
      {!ctx?.isGestor && (
        <div>
          <div className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-3">Por Plaza</div>
          <div className="border border-[#1e1e1e] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
                  {['Plaza', 'Titulares', 'Cuentas activas', 'Capital', 'Saldo'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[8px] font-mono tracking-[2px] text-[#555] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plazasList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#333] text-xs font-mono">Sin datos</td>
                  </tr>
                ) : plazasList.map((p, i) => (
                  <tr key={p.nombre} className={`border-b border-[#111] ${i % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#0a0a0a]'}`}>
                    <td className="px-4 py-3 text-[12px] text-[#e8e8e8]">{p.nombre}</td>
                    <td className="px-4 py-3 text-[11px] font-mono text-[#888]">{p.titulares.size}</td>
                    <td className="px-4 py-3 text-[11px] font-mono text-[#d4af37]">{p.activas}</td>
                    <td className="px-4 py-3 text-[11px] font-mono text-[#888]">${fmt(p.capitalTotal)}</td>
                    <td className="px-4 py-3 text-[11px] font-mono text-[#e8e8e8]">${fmt(p.saldoTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
