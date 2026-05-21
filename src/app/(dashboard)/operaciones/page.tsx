import { prisma } from '@/lib/prisma'
import { getSessionCtx, plazaAbonoFilter } from '@/lib/session-context'
import Link from 'next/link'
import PlazaFilter from '@/components/PlazaFilter'

export default async function OperacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ plaza?: string }>
}) {
  const { plaza: plazaFilter = '' } = await searchParams
  const ctx = await getSessionCtx()
  const tenant = ctx?.tenant ?? await prisma.tenant.findFirst()

  const [todasPlazas, abonos] = await Promise.all([
    !ctx?.isGestor && tenant
      ? prisma.plaza.findMany({
          where: { tenantId: tenant.id },
          select: { id: true, nombre: true, ciudad: true },
          orderBy: { nombre: 'asc' },
        })
      : Promise.resolve([]),
    tenant
      ? prisma.abono.findMany({
          where: {
            tenantId: tenant.id,
            ...(ctx?.isGestor
              ? plazaAbonoFilter(ctx)
              : plazaFilter ? { cuenta: { cliente: { plazaId: plazaFilter } } } : {}),
          },
          include: {
            cuenta: { include: { cliente: true } },
            operador: true,
          },
          orderBy: { fecha: 'desc' },
          take: 100,
        })
      : Promise.resolve([]),
  ])

  const fmt = (n: number) => n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  const totalHoy = abonos
    .filter(a => {
      const d = new Date(a.fecha)
      const hoy = new Date()
      return d.getDate() === hoy.getDate() && d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear()
    })
    .reduce((s, a) => s + Number(a.monto), 0)

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#e8e8e8]">Operaciones</h1>
          <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
            {ctx?.isGestor && ctx.plazaId
              ? 'Tu plaza'
              : plazaFilter && todasPlazas.find(p => p.id === plazaFilter)
                ? todasPlazas.find(p => p.id === plazaFilter)!.nombre
                : 'Todas las plazas'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {!ctx?.isGestor && todasPlazas.length > 1 && (
            <PlazaFilter plazas={todasPlazas} selected={plazaFilter} />
          )}
          {totalHoy > 0 && (
            <div className="text-right">
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-wider">Cobrado hoy</div>
              <div className="text-[15px] font-mono text-[#27ae60]">${fmt(totalHoy)}</div>
            </div>
          )}
        </div>
      </div>

      {abonos.length === 0 ? (
        <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-12 text-center">
          <div className="text-[#333] text-xs font-mono tracking-wider">No hay abonos registrados</div>
        </div>
      ) : (
        <div className="border border-[#1e1e1e] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
                {['Fecha', 'Titular', 'Capital', 'Abono', 'Saldo restante', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[8px] font-mono tracking-[2px] text-[#555] uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {abonos.map((a, i) => (
                <tr key={a.id} className={`border-b border-[#111] hover:bg-[#111] transition-colors ${i % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#0a0a0a]'}`}>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#888]">
                    {new Date(a.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#e8e8e8]">{a.cuenta.cliente.nombre}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#555]">${fmt(Number(a.cuenta.assigned_capital))}</td>
                  <td className="px-4 py-3 text-[12px] font-mono text-[#27ae60]">${fmt(Number(a.monto))}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#888]">${fmt(Number(a.cuenta.remaining_balance))}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/cuentas/${a.cuentaId}`} className="text-[10px] font-mono text-[#555] hover:text-[#d4af37] transition-colors">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-[#0a0a0a] border-t border-[#111]">
            <span className="text-[9px] font-mono text-[#333]">{abonos.length} registro{abonos.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  )
}
