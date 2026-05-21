import { prisma } from '@/lib/prisma'
import { getSessionCtx, plazaCuentaFilter } from '@/lib/session-context'
import Link from 'next/link'
import PlazaFilter from '@/components/PlazaFilter'
import { calcRating, isDueToday, RATING_CONFIG, type RatingKey } from '@/lib/rating'

const PLAN_LABELS: Record<string, string> = {
  DIARIO:    'Diario',
  SEMANAL:   'Semanal',
  QUINCENAL: 'Quincenal',
  MENSUAL:   'Mensual',
}

export default async function RutasPage({
  searchParams,
}: {
  searchParams: Promise<{ plaza?: string }>
}) {
  const { plaza: plazaFilter = '' } = await searchParams
  const ctx    = await getSessionCtx()
  const tenant = ctx?.tenant ?? await prisma.tenant.findFirst()
  if (!tenant) return <div className="p-6 text-[#555] font-mono text-xs">Sin datos</div>

  const cuentaFilter = ctx?.isGestor
    ? plazaCuentaFilter(ctx)
    : plazaFilter
      ? { cliente: { plazaId: plazaFilter } }
      : {}

  const [todasPlazas, cuentas] = await Promise.all([
    !ctx?.isGestor
      ? prisma.plaza.findMany({
          where: { tenantId: tenant.id },
          select: { id: true, nombre: true, ciudad: true },
          orderBy: { nombre: 'asc' },
        })
      : Promise.resolve([]),
    prisma.cuenta.findMany({
      where: {
        tenantId: tenant.id,
        estado: { in: ['ACTIVA', 'SEGUIMIENTO'] },
        ...cuentaFilter,
      },
      select: {
        id: true,
        plan_abono: true,
        monto_abono: true,
        remaining_balance: true,
        fecha_apertura: true,
        estado: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            plaza: { select: { nombre: true } },
          },
        },
        abonos: {
          orderBy: { fecha: 'desc' },
          take: 1,
          select: { fecha: true },
        },
      },
    }),
  ])

  const fmt = (n: number) => n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  // Filtrar cuentas que requieren cobro hoy y calcular rating
  type RutaItem = {
    id: string
    clienteId: string
    clienteNombre: string
    plazaNombre: string
    planAbono: string
    montoAbono: number
    saldo: number
    lastAbono: Date | null
    rating: RatingKey
    priority: number
    diasVencido: number
  }

  const INTERVALS: Record<string, number> = {
    DIARIO: 1, SEMANAL: 7, QUINCENAL: 15, MENSUAL: 30,
  }

  const rutas: RutaItem[] = cuentas
    .filter(c => isDueToday(c.plan_abono, c.abonos[0]?.fecha ?? null, c.fecha_apertura))
    .map(c => {
      const lastAbono  = c.abonos[0]?.fecha ?? null
      const rating     = calcRating(c.plan_abono, lastAbono, c.fecha_apertura)
      const interval   = INTERVALS[c.plan_abono] ?? 1
      const daysSince  = lastAbono
        ? Math.floor((Date.now() - new Date(lastAbono).setHours(0,0,0,0)) / 86400000)
        : Math.floor((Date.now() - new Date(c.fecha_apertura).setHours(0,0,0,0)) / 86400000)
      const diasVencido = Math.max(0, daysSince - interval)
      return {
        id:             c.id,
        clienteId:      c.cliente.id,
        clienteNombre:  c.cliente.nombre,
        plazaNombre:    c.cliente.plaza.nombre,
        planAbono:      c.plan_abono,
        montoAbono:     Number(c.monto_abono),
        saldo:          Number(c.remaining_balance),
        lastAbono,
        rating,
        priority:       RATING_CONFIG[rating].priority,
        diasVencido,
      }
    })
    .sort((a, b) => a.priority - b.priority) // menor priority = más urgente

  const today = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#e8e8e8]">Rutas</h1>
          <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
            Cuentas por cobrar — {today}
            {plazaFilter && todasPlazas.find(p => p.id === plazaFilter)
              ? ` — ${todasPlazas.find(p => p.id === plazaFilter)!.nombre}`
              : ''}
          </p>
        </div>
        {!ctx?.isGestor && todasPlazas.length > 1 && (
          <PlazaFilter plazas={todasPlazas} selected={plazaFilter} />
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="border border-[#1e1e1e] bg-[#0a0a0a] p-4">
          <div className="text-[7.5px] font-mono tracking-[1.5px] text-[#555] uppercase mb-2">Total Hoy</div>
          <div className="text-2xl font-mono text-[#d4af37]">{rutas.length}</div>
        </div>
        {(['NULO', 'INCONSISTENTE', 'REGULAR', 'BUENO', 'EXCELENTE'] as RatingKey[])
          .map(rk => ({ rk, count: rutas.filter(r => r.rating === rk).length }))
          .filter(s => s.count > 0)
          .map(({ rk, count }) => {
            const cfg = RATING_CONFIG[rk]
            return (
              <div key={rk} className="border bg-[#0a0a0a] p-4" style={{ borderColor: cfg.border }}>
                <div className="text-[7.5px] font-mono tracking-[1.5px] uppercase mb-2" style={{ color: cfg.color }}>
                  {cfg.label}
                </div>
                <div className="text-2xl font-mono" style={{ color: cfg.color }}>{count}</div>
              </div>
            )
          })}
      </div>

      {/* Tabla */}
      {rutas.length === 0 ? (
        <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-12 text-center">
          <div className="text-[#333] text-xs font-mono tracking-wider">
            No hay cuentas pendientes de cobro para hoy
          </div>
        </div>
      ) : (
        <div className="border border-[#1e1e1e] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
                {['#', 'Titular', ...(ctx?.isGestor ? [] : ['Plaza']), 'Frecuencia', 'Cuota', 'Saldo', 'Último Abono', 'Días Vencido', 'Calificación', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[8px] font-mono tracking-[2px] text-[#555] uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rutas.map((r, i) => {
                const cfg = RATING_CONFIG[r.rating]
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-[#111] hover:bg-[#111] transition-colors ${i % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#0a0a0a]'}`}
                  >
                    <td className="px-4 py-3 text-[10px] font-mono text-[#333]">{i + 1}</td>
                    <td className="px-4 py-3 text-[12px] text-[#e8e8e8]">{r.clienteNombre}</td>
                    {!ctx?.isGestor && (
                      <td className="px-4 py-3 text-[11px] font-mono text-[#555]">{r.plazaNombre}</td>
                    )}
                    <td className="px-4 py-3 text-[10px] font-mono text-[#888]">{PLAN_LABELS[r.planAbono] ?? r.planAbono}</td>
                    <td className="px-4 py-3 text-[11px] font-mono text-[#d4af37]">${fmt(r.montoAbono)}</td>
                    <td className="px-4 py-3 text-[11px] font-mono text-[#888]">${fmt(r.saldo)}</td>
                    <td className="px-4 py-3 text-[10px] font-mono text-[#555]">
                      {r.lastAbono
                        ? new Date(r.lastAbono).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })
                        : 'Sin abonos'}
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono">
                      {r.diasVencido === 0
                        ? <span className="text-[#555]">Hoy</span>
                        : <span className="text-[#c0392b]">{r.diasVencido}d</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[9px] font-mono px-2 py-0.5 border"
                        style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/cuentas/${r.id}`}
                        className="text-[10px] font-mono text-[#555] hover:text-[#d4af37] transition-colors"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-[#0a0a0a] border-t border-[#111]">
            <span className="text-[9px] font-mono text-[#333]">
              {rutas.length} cuenta{rutas.length !== 1 ? 's' : ''} pendiente{rutas.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
