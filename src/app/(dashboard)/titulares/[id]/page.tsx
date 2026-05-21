import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Phone, MapPin, User } from 'lucide-react'

export default async function TitularDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: { plaza: true, cuentas: { orderBy: { createdAt: 'desc' } } },
  })

  if (!cliente) notFound()

  return (
    <div className="p-6 max-w-3xl">

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/titulares"
          className="flex items-center gap-1.5 text-[10px] font-mono text-[#555] hover:text-[#888] transition-colors mb-4"
        >
          <ArrowLeft size={11} /> Volver a Titulares
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl text-[#e8e8e8]">{cliente.nombre}</h1>
            <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
              Titular · {cliente.identificacion}
            </p>
          </div>
          <span
            className={`text-[9px] font-mono tracking-wider px-2 py-1 ${
              cliente.activo
                ? 'text-[#27ae60] bg-[rgba(39,174,96,0.08)] border border-[rgba(39,174,96,0.2)]'
                : 'text-[#555] bg-[#111] border border-[#1e1e1e]'
            }`}
          >
            {cliente.activo ? 'ACTIVO' : 'INACTIVO'}
          </span>
        </div>
      </div>

      {/* Info card */}
      <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-6 mb-4">
        <div className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-4">
          Información del titular
        </div>
        <div className="grid grid-cols-2 gap-6">
          <InfoRow icon={<User size={11} />} label="Identificación" value={cliente.identificacion} />
          <InfoRow icon={<Phone size={11} />} label="Teléfono" value={cliente.telefono} />
          <InfoRow icon={<MapPin size={11} />} label="Dirección" value={cliente.direccion} />
          <InfoRow icon={<MapPin size={11} />} label="Plaza" value={cliente.plaza.nombre} />
          {cliente.referencia1 && (
            <InfoRow label="Referencia 1" value={cliente.referencia1} />
          )}
          {cliente.referencia2 && (
            <InfoRow label="Referencia 2" value={cliente.referencia2} />
          )}
        </div>
      </div>

      {/* Cuentas */}
      <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase">
            Cuentas de capital ({cliente.cuentas.length})
          </div>
          <Link
            href={`/cuentas/nueva?titular=${cliente.id}`}
            className="text-[10px] font-mono text-[#d4af37] hover:underline"
          >
            + Nueva cuenta
          </Link>
        </div>
        {cliente.cuentas.length === 0 ? (
          <div className="text-[#333] text-xs font-mono text-center py-6">
            Sin cuentas de capital registradas
          </div>
        ) : (
          <div className="space-y-2">
            {cliente.cuentas.map(c => (
              <Link
                key={c.id}
                href={`/cuentas/${c.id}`}
                className="flex items-center justify-between p-3 border border-[#1e1e1e] hover:border-[rgba(212,175,55,0.2)] hover:bg-[#111] transition-colors"
              >
                <div>
                  <div className="text-[11px] font-mono text-[#888]">
                    Capital: <span className="text-[#d4af37]">${Number(c.assigned_capital).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="text-[9px] font-mono text-[#555] mt-0.5">
                    {c.plan_abono} · Saldo: ${Number(c.remaining_balance).toLocaleString('es-CO')}
                  </div>
                </div>
                <span className={`text-[9px] font-mono px-2 py-0.5 border ${
                  c.estado === 'ACTIVA'
                    ? 'text-[#27ae60] border-[rgba(39,174,96,0.2)] bg-[rgba(39,174,96,0.06)]'
                    : c.estado === 'SEGUIMIENTO'
                    ? 'text-[#e67e22] border-[rgba(230,126,34,0.2)] bg-[rgba(230,126,34,0.06)]'
                    : 'text-[#555] border-[#1e1e1e]'
                }`}>
                  {c.estado}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div>
      <div className="text-[9px] font-mono tracking-[1.5px] text-[#555] uppercase mb-1 flex items-center gap-1.5">
        {icon}{label}
      </div>
      <div className="text-[12px] text-[#e8e8e8] font-mono">{value}</div>
    </div>
  )
}
