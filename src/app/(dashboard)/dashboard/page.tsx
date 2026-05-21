import { prisma } from '@/lib/prisma'
import { getSessionCtx, plazaCuentaFilter, plazaAbonoFilter } from '@/lib/session-context'
import Link from 'next/link'
import PlazaFilter from '@/components/PlazaFilter'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ plaza?: string }>
}) {
  const { plaza: plazaFilter = '' } = await searchParams
  const ctx    = await getSessionCtx()
  const tenant = ctx?.tenant ?? await prisma.tenant.findFirst()
  if (!tenant) return <div className="p-6 text-[#555] font-mono text-xs">Sin datos</div>

  // ADMIN puede filtrar por plaza via ?plaza=<id>; GESTOR siempre usa su plaza
  const activePlazaFilter = ctx?.isGestor
    ? plazaCuentaFilter(ctx)
    : plazaFilter
      ? { cliente: { plazaId: plazaFilter } }
      : {}

  const activeAbonoFilter = ctx?.isGestor
    ? plazaAbonoFilter(ctx)
    : plazaFilter
      ? { cuenta: { cliente: { plazaId: plazaFilter } } }
      : {}

  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0))
  const endOfDay   = new Date(new Date().setHours(23, 59, 59, 999))

  const [cuentas, abonosHoy] = await Promise.all([
    prisma.cuenta.findMany({
      where: { tenantId: tenant.id, ...activePlazaFilter },
      select: { estado: true, assigned_capital: true, remaining_balance: true, total_abonado: true },
    }),
    prisma.abono.findMany({
      where: { tenantId: tenant.id, ...activeAbonoFilter, fecha: { gte: startOfDay, lt: endOfDay } },
      select: { monto: true },
    }),
  ])

  const activas      = cuentas.filter(c => c.estado === 'ACTIVA').length
  const seguimiento  = cuentas.filter(c => c.estado === 'SEGUIMIENTO').length
  const capitalTotal = cuentas.filter(c => c.estado !== 'CERRADA').reduce((s, c) => s + Number(c.assigned_capital), 0)
  const saldoTotal   = cuentas.filter(c => c.estado !== 'CERRADA').reduce((s, c) => s + Number(c.remaining_balance), 0)
  const cobradoHoy   = abonosHoy.reduce((s, a) => s + Number(a.monto), 0)
  const cobradoTotal = cuentas.reduce((s, c) => s + Number(c.total_abonado), 0)

  const fmt = (n: number) => n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  // ── ADMIN: lista de plazas para el filtro (dropdown) ─────────────────────
  const todasPlazas = !ctx?.isGestor
    ? await prisma.plaza.findMany({
        where: { tenantId: tenant.id },
        select: { id: true, nombre: true, ciudad: true },
        orderBy: { nombre: 'asc' },
      })
    : []

  // ── ADMIN: breakdown por plaza ─────────────────────────────────────────────
  const plazasData = !ctx?.isGestor
    ? await prisma.plaza.findMany({
        where: {
          tenantId: tenant.id,
          ...(plazaFilter ? { id: plazaFilter } : {}),
        },
        select: {
          id: true, nombre: true, ciudad: true,
          usuarios: {
            where: { activo: true, rol: { in: ['PLAZA_ADMIN', 'ASESOR'] as any } },
            select: { nombre: true },
          },
          clientes: {
            select: {
              cuentas: {
                select: { estado: true, assigned_capital: true, remaining_balance: true },
              },
            },
          },
        },
        orderBy: { nombre: 'asc' },
      })
    : []

  const plazasSinGestor = plazasData.filter(p => p.usuarios.length === 0)

  // ── GESTOR: nombre de su plaza ─────────────────────────────────────────────
  const plazaInfo = ctx?.isGestor && ctx.plazaId
    ? await prisma.plaza.findUnique({
        where: { id: ctx.plazaId },
        select: { nombre: true, ciudad: true },
      })
    : null

  const kpis = [
    { label: 'Cuentas Activas',     value: String(activas),        gold: true  },
    { label: 'Capital en Posición', value: `$${fmt(capitalTotal)}`, gold: true  },
    { label: 'Cobrado Hoy',         value: `$${fmt(cobradoHoy)}`,  gold: false },
    { label: 'En Seguimiento',      value: String(seguimiento),    gold: false },
  ]

  const adminLinks = [
    { label: 'Nueva Cuenta',         href: '/cuentas/nueva'     },
    { label: 'Nuevo Titular',        href: '/titulares/nuevo'   },
    { label: 'Ver Reportes',         href: '/reportes'          },
    { label: 'Gestionar Operadores', href: '/operadores'        },
  ]

  const gestorLinks = [
    { label: 'Nueva Cuenta',  href: '/cuentas/nueva'    },
    { label: 'Nuevo Titular', href: '/titulares/nuevo'  },
    { label: 'Nuevo Abono',   href: '/operaciones/nuevo'},
  ]

  const quickLinks = ctx?.isGestor ? gestorLinks : adminLinks

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#e8e8e8]">Dashboard</h1>
          <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
            {ctx?.isGestor && plazaInfo
              ? `${plazaInfo.nombre} — ${plazaInfo.ciudad}`
              : plazaFilter && todasPlazas.find(p => p.id === plazaFilter)
                ? `Filtrando: ${todasPlazas.find(p => p.id === plazaFilter)!.nombre}`
                : 'Resumen general del sistema'}
          </p>
        </div>
        {!ctx?.isGestor && todasPlazas.length > 1 && (
          <PlazaFilter plazas={todasPlazas} selected={plazaFilter} />
        )}
      </div>

      {/* Alerta: plazas sin gestor — solo ADMIN */}
      {!ctx?.isGestor && plazasSinGestor.length > 0 && (
        <div className="mb-5 flex items-center justify-between border border-[rgba(192,57,43,0.35)] bg-[rgba(192,57,43,0.05)] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-[#c0392b] text-xs font-mono">!</span>
            <span className="text-[10px] font-mono text-[#c0392b]">
              {plazasSinGestor.length === 1
                ? `La plaza "${plazasSinGestor[0].nombre}" no tiene Gestor activo asignado`
                : `${plazasSinGestor.length} plazas sin Gestor activo asignado`}
            </span>
          </div>
          <Link
            href="/operadores"
            className="text-[9px] font-mono tracking-[1.5px] uppercase text-[#c0392b] hover:text-[#e8e8e8] transition-colors"
          >
            Gestionar →
          </Link>
        </div>
      )}

      {/* KPIs fila 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-[#0a0a0a] border border-[#1e1e1e] p-4">
            <div className="text-[7.5px] font-mono tracking-[1.5px] text-[#555] uppercase mb-2">{k.label}</div>
            <div className={`text-2xl font-mono leading-none ${k.gold ? 'text-[#d4af37]' : 'text-[#e8e8e8]'}`}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* KPIs fila 2 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-4">
          <div className="text-[7.5px] font-mono tracking-[1.5px] text-[#555] uppercase mb-2">Total Abonado (histórico)</div>
          <div className="text-xl font-mono text-[#27ae60] leading-none">${fmt(cobradoTotal)}</div>
        </div>
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-4">
          <div className="text-[7.5px] font-mono tracking-[1.5px] text-[#555] uppercase mb-2">Saldo Pendiente</div>
          <div className="text-xl font-mono text-[#e8e8e8] leading-none">${fmt(saldoTotal)}</div>
        </div>
      </div>

      {/* ADMIN: tabla de plazas */}
      {!ctx?.isGestor && plazasData.length > 0 && (
        <div className="mb-6">
          <div className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-3">Por Plaza</div>
          <div className="border border-[#1e1e1e] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
                  {['Plaza', 'Ciudad', 'Gestor', 'Activas', 'Capital', 'Saldo'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[8px] font-mono tracking-[2px] text-[#555] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plazasData.map((pl, i) => {
                  const todasCuentas = pl.clientes.flatMap(c => c.cuentas)
                  const plActivas    = todasCuentas.filter(c => c.estado === 'ACTIVA').length
                  const plCapital    = todasCuentas.reduce((s, c) => s + Number(c.assigned_capital), 0)
                  const plSaldo      = todasCuentas.reduce((s, c) => s + Number(c.remaining_balance), 0)
                  return (
                    <tr key={pl.id} className={`border-b border-[#111] ${i % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#0a0a0a]'}`}>
                      <td className="px-4 py-3 text-[12px] text-[#e8e8e8]">{pl.nombre}</td>
                      <td className="px-4 py-3 text-[11px] font-mono text-[#888]">{pl.ciudad}</td>
                      <td className="px-4 py-3">
                        {pl.usuarios.length === 0 ? (
                          <Link href={`/operadores/nuevo?plazaId=${pl.id}`} className="text-[9px] font-mono text-[#c0392b] hover:underline">
                            Sin gestor →
                          </Link>
                        ) : (
                          <span className="text-[11px] font-mono text-[#555]">
                            {pl.usuarios.map(u => u.nombre).join(', ')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-mono text-[#d4af37]">{plActivas}</td>
                      <td className="px-4 py-3 text-[11px] font-mono text-[#888]">${fmt(plCapital)}</td>
                      <td className="px-4 py-3 text-[11px] font-mono text-[#888]">${fmt(plSaldo)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      <div className={`grid gap-3 ${ctx?.isGestor ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {quickLinks.map(a => (
          <Link
            key={a.href}
            href={a.href}
            className="border border-[#1e1e1e] bg-[#0a0a0a] px-4 py-3 text-[10px] font-mono text-[#555] hover:text-[#d4af37] hover:border-[rgba(212,175,55,0.3)] transition-colors text-center tracking-wider"
          >
            {a.label} →
          </Link>
        ))}
      </div>
    </div>
  )
}
