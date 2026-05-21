import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, TrendingUp, Calendar, Hash } from 'lucide-react'

export default async function CuentaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const cuenta = await prisma.cuenta.findUnique({
    where: { id },
    include: {
      cliente: { include: { plaza: true } },
      operador: true,
      abonos: { orderBy: { fecha: 'desc' }, take: 50 },
    },
  })

  if (!cuenta) notFound()

  const capital    = Number(cuenta.assigned_capital)
  const total      = Number(cuenta.total_a_retornar)
  const abonado    = Number(cuenta.total_abonado)
  const saldo      = Number(cuenta.remaining_balance)
  const tasa       = Number(cuenta.yield_rate) * 100
  const cuota      = Number(cuenta.monto_abono)
  const progreso   = total > 0 ? Math.min((abonado / total) * 100, 100) : 0

  const fmt = (n: number) => n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  const estadoColors: Record<string, string> = {
    ACTIVA:      'text-[#27ae60] border-[rgba(39,174,96,0.2)] bg-[rgba(39,174,96,0.06)]',
    SEGUIMIENTO: 'text-[#e67e22] border-[rgba(230,126,34,0.2)] bg-[rgba(230,126,34,0.06)]',
    CERRADA:     'text-[#555] border-[#1e1e1e] bg-[#0a0a0a]',
  }

  return (
    <div className="p-6 max-w-3xl">

      {/* Header */}
      <div className="mb-6">
        <Link href={`/titulares/${cuenta.clienteId}`}
          className="flex items-center gap-1.5 text-[10px] font-mono text-[#555] hover:text-[#888] transition-colors mb-4">
          <ArrowLeft size={11} /> {cuenta.cliente.nombre}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl text-[#e8e8e8]">
              ${fmt(capital)} <span className="text-[#555] text-lg">capital</span>
            </h1>
            <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
              Cuenta de Capital · {cuenta.plan_abono} · {cuenta.n_cuotas} cuotas
            </p>
          </div>
          <span className={`text-[9px] font-mono tracking-wider px-2 py-1 border ${estadoColors[cuenta.estado]}`}>
            {cuenta.estado}
          </span>
        </div>
      </div>

      {/* Progreso */}
      <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-5 mb-4">
        <div className="flex justify-between text-[9px] font-mono text-[#555] uppercase tracking-wider mb-3">
          <span>Progreso de retorno</span>
          <span>{progreso.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-[#111] w-full">
          <div className="h-full bg-[#d4af37] transition-all" style={{ width: `${progreso}%` }} />
        </div>
        <div className="flex justify-between mt-3">
          <div className="text-center">
            <div className="text-[9px] font-mono text-[#555] uppercase tracking-wider">Abonado</div>
            <div className="text-[13px] font-mono text-[#27ae60] mt-0.5">${fmt(abonado)}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-mono text-[#555] uppercase tracking-wider">Saldo</div>
            <div className="text-[13px] font-mono text-[#e8e8e8] mt-0.5">${fmt(saldo)}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-mono text-[#555] uppercase tracking-wider">Total</div>
            <div className="text-[13px] font-mono text-[#d4af37] mt-0.5">${fmt(total)}</div>
          </div>
        </div>
      </div>

      {/* Detalles */}
      <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-5 mb-4">
        <div className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-4">Detalles de la cuenta</div>
        <div className="grid grid-cols-2 gap-5">
          <InfoRow icon={<TrendingUp size={11} />} label="Cuota" value={`$${fmt(cuota)} / ${cuenta.plan_abono.toLowerCase()}`} />
          <InfoRow icon={<Hash size={11} />} label="Tasa de rendimiento" value={`${tasa.toFixed(1)}%`} />
          <InfoRow icon={<Calendar size={11} />} label="Apertura" value={new Date(cuenta.fecha_apertura).toLocaleDateString('es-CO')} />
          <InfoRow icon={<Calendar size={11} />} label="Proyectado cierre" value={new Date(cuenta.fecha_proyectada).toLocaleDateString('es-CO')} />
          <InfoRow label="Titular" value={cuenta.cliente.nombre} />
          <InfoRow label="Plaza" value={cuenta.cliente.plaza.nombre} />
          {cuenta.notas && <InfoRow label="Notas" value={cuenta.notas} />}
        </div>
      </div>

      {/* Abonos */}
      <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase">
            Abonos ({cuenta.abonos.length})
          </div>
          <Link href={`/operaciones/nuevo?cuenta=${cuenta.id}`}
            className="text-[10px] font-mono text-[#d4af37] hover:underline">
            + Registrar abono
          </Link>
        </div>
        {cuenta.abonos.length === 0 ? (
          <div className="text-[#333] text-xs font-mono text-center py-6">Sin abonos registrados</div>
        ) : (
          <div className="space-y-1">
            {cuenta.abonos.map(a => (
              <div key={a.id} className="flex items-center justify-between px-3 py-2 border border-[#1e1e1e] bg-[#0a0a0a]">
                <span className="text-[11px] font-mono text-[#888]">
                  {new Date(a.fecha).toLocaleDateString('es-CO')}
                </span>
                <span className="text-[12px] font-mono text-[#27ae60]">${fmt(Number(a.monto))}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] font-mono tracking-[1.5px] text-[#555] uppercase mb-1 flex items-center gap-1.5">
        {icon}{label}
      </div>
      <div className="text-[12px] text-[#e8e8e8] font-mono">{value}</div>
    </div>
  )
}
