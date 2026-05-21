import { prisma } from '@/lib/prisma'
import { getSessionCtx, plazaCuentaFilter } from '@/lib/session-context'
import Link from 'next/link'
import PlazaFilter from '@/components/PlazaFilter'

export default async function CuentasPage({
  searchParams,
}: {
  searchParams: Promise<{ plaza?: string }>
}) {
  const { plaza: plazaFilter = '' } = await searchParams
  const ctx = await getSessionCtx()
  const tenant = ctx?.tenant ?? await prisma.tenant.findFirst()

  const [todasPlazas, cuentas] = await Promise.all([
    !ctx?.isGestor && tenant
      ? prisma.plaza.findMany({
          where: { tenantId: tenant.id },
          select: { id: true, nombre: true, ciudad: true },
          orderBy: { nombre: 'asc' },
        })
      : Promise.resolve([]),
    tenant
      ? prisma.cuenta.findMany({
          where: {
            tenantId: tenant.id,
            ...(ctx?.isGestor
              ? plazaCuentaFilter(ctx)
              : plazaFilter ? { cliente: { plazaId: plazaFilter } } : {}),
          },
          include: { cliente: true },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve([]),
  ])

  const fmt = (n: number) => n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  const estadoColors: Record<string, string> = {
    ACTIVA:      'text-[#27ae60] border-[rgba(39,174,96,0.2)] bg-[rgba(39,174,96,0.06)]',
    SEGUIMIENTO: 'text-[#e67e22] border-[rgba(230,126,34,0.2)] bg-[rgba(230,126,34,0.06)]',
    CERRADA:     'text-[#555] border-[#1e1e1e]',
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#e8e8e8]">Cuentas de Capital</h1>
          <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
            {ctx?.isGestor && ctx.plazaId
              ? 'Tu plaza'
              : plazaFilter && todasPlazas.find(p => p.id === plazaFilter)
                ? todasPlazas.find(p => p.id === plazaFilter)!.nombre
                : 'Todas las plazas'}
          </p>
        </div>
        {!ctx?.isGestor && todasPlazas.length > 1 && (
          <PlazaFilter plazas={todasPlazas} selected={plazaFilter} />
        )}
      </div>

      {cuentas.length === 0 ? (
        <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-12 text-center">
          <div className="text-[#333] text-xs font-mono tracking-wider mb-3">No hay cuentas registradas</div>
          <Link href="/titulares" className="text-[#d4af37] text-xs font-mono hover:underline">
            Ir a Titulares para crear una cuenta →
          </Link>
        </div>
      ) : (
        <div className="border border-[#1e1e1e] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
                {['Titular', 'Capital', 'Cuota', 'Plan', 'Saldo', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[8px] font-mono tracking-[2px] text-[#555] uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cuentas.map((c, i) => (
                <tr key={c.id} className={`border-b border-[#111] hover:bg-[#111] transition-colors ${i % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#0a0a0a]'}`}>
                  <td className="px-4 py-3 text-[12px] text-[#e8e8e8]">{c.cliente.nombre}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#d4af37]">${fmt(Number(c.assigned_capital))}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#888]">${fmt(Number(c.monto_abono))}</td>
                  <td className="px-4 py-3 text-[10px] font-mono text-[#555]">{c.plan_abono}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#888]">${fmt(Number(c.remaining_balance))}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-mono tracking-wider px-2 py-0.5 border ${estadoColors[c.estado]}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/cuentas/${c.id}`} className="text-[10px] font-mono text-[#555] hover:text-[#d4af37] transition-colors">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-[#0a0a0a] border-t border-[#111]">
            <span className="text-[9px] font-mono text-[#333]">{cuentas.length} cuenta{cuentas.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  )
}
