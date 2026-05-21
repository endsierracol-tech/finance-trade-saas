import { prisma } from '@/lib/prisma'
import { getSessionCtx, plazaClienteFilter } from '@/lib/session-context'
import Link from 'next/link'
import { UserPlus, Search } from 'lucide-react'
import { worstRating, RATING_CONFIG } from '@/lib/rating'
import PlazaFilter from '@/components/PlazaFilter'

export default async function TitularesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plaza?: string }>
}) {
  const { q = '', plaza: plazaFilter = '' } = await searchParams
  const ctx = await getSessionCtx()
  const tenant = ctx?.tenant ?? await prisma.tenant.findFirst()

  const [todasPlazas, clientes] = await Promise.all([
    !ctx?.isGestor && tenant
      ? prisma.plaza.findMany({
          where: { tenantId: tenant.id },
          select: { id: true, nombre: true, ciudad: true },
          orderBy: { nombre: 'asc' },
        })
      : Promise.resolve([]),
    tenant
      ? prisma.cliente.findMany({
          where: {
            tenantId: tenant.id,
            ...(ctx?.isGestor
              ? plazaClienteFilter(ctx)
              : plazaFilter ? { plazaId: plazaFilter } : {}),
            ...(q
              ? {
                  OR: [
                    { nombre:         { contains: q, mode: 'insensitive' } },
                    { identificacion: { contains: q, mode: 'insensitive' } },
                  ],
                }
              : {}),
          },
        include: {
          plaza: true,
          cuentas: {
            where: { estado: { in: ['ACTIVA', 'SEGUIMIENTO'] } },
            select: {
              plan_abono: true,
              fecha_apertura: true,
              abonos: {
                orderBy: { fecha: 'desc' },
                take: 1,
                select: { fecha: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      : Promise.resolve([]),
  ])

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#e8e8e8]">Titulares</h1>
          <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
            {ctx?.isGestor && ctx.plazaId
              ? 'Tu plaza'
              : plazaFilter && todasPlazas.find(p => p.id === plazaFilter)
                ? todasPlazas.find(p => p.id === plazaFilter)!.nombre
                : 'Todas las plazas'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!ctx?.isGestor && todasPlazas.length > 1 && (
            <PlazaFilter plazas={todasPlazas} selected={plazaFilter} />
          )}
          <Link
            href="/titulares/nuevo"
            className="flex items-center gap-2 px-4 py-2 text-[11px] font-mono tracking-wider border border-[rgba(212,175,55,0.4)] text-[#d4af37] hover:bg-[rgba(212,175,55,0.08)] transition-colors"
          >
            <UserPlus size={13} />
            Nuevo Titular
          </Link>
        </div>
      </div>

      {/* Search */}
      <form className="mb-4">
        <div className="relative max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Nombre o identificación..."
            className="w-full bg-[#0a0a0a] border border-[#1e1e1e] text-[#e8e8e8] text-xs font-mono pl-8 pr-4 py-2 outline-none focus:border-[rgba(212,175,55,0.3)] transition-colors placeholder:text-[#333]"
          />
        </div>
      </form>

      {/* Table / Empty state */}
      {clientes.length === 0 ? (
        <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-12 text-center">
          <div className="text-[#333] text-xs font-mono tracking-wider mb-3">
            {q ? 'Sin resultados para la búsqueda' : 'No hay titulares registrados'}
          </div>
          {!q && (
            <Link
              href="/titulares/nuevo"
              className="text-[#d4af37] text-xs font-mono hover:underline"
            >
              Registrar primer titular →
            </Link>
          )}
        </div>
      ) : (
        <div className="border border-[#1e1e1e] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
                {['Nombre', 'Identificación', 'Teléfono', 'Plaza', 'Calificación', 'Estado', ''].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[8px] font-mono tracking-[2px] text-[#555] uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-[#111] transition-colors hover:bg-[#111] ${
                    i % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#0a0a0a]'
                  }`}
                >
                  <td className="px-4 py-3 text-[12px] text-[#e8e8e8]">{c.nombre}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#888]">{c.identificacion}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#888]">{c.telefono}</td>
                  <td className="px-4 py-3 text-[10px] font-mono text-[#555]">{c.plaza.nombre}</td>
                  <td className="px-4 py-3">
                    {c.cuentas.length === 0 ? (
                      <span className="text-[9px] font-mono text-[#333]">—</span>
                    ) : (() => {
                      const rk  = worstRating(c.cuentas.map(ac => ({
                        planAbono:     ac.plan_abono,
                        lastAbono:     ac.abonos[0]?.fecha ?? null,
                        fechaApertura: ac.fecha_apertura,
                      })))
                      const cfg = RATING_CONFIG[rk]
                      return (
                        <span
                          className="text-[9px] font-mono px-2 py-0.5 border"
                          style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
                        >
                          {cfg.label}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[9px] font-mono tracking-wider px-2 py-0.5 ${
                        c.activo
                          ? 'text-[#27ae60] bg-[rgba(39,174,96,0.08)] border border-[rgba(39,174,96,0.2)]'
                          : 'text-[#555] bg-[#111] border border-[#1e1e1e]'
                      }`}
                    >
                      {c.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/titulares/${c.id}`}
                      className="text-[10px] font-mono text-[#555] hover:text-[#d4af37] transition-colors"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-[#0a0a0a] border-t border-[#111]">
            <span className="text-[9px] font-mono text-[#333]">
              {clientes.length} titular{clientes.length !== 1 ? 'es' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
