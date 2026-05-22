import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionCtx } from '@/lib/session-context'
import { prisma } from '@/lib/prisma'
import { ChevronLeft, HeadphonesIcon, AlertTriangle, Activity, Users, MapPin } from 'lucide-react'

const ACCION_LABEL: Record<string, string> = {
  CUENTA_ABIERTA:     '+ Cuenta abierta',
  CUENTA_CERRADA:     '✓ Cuenta cerrada',
  ABONO_REGISTRADO:   '● Abono registrado',
  TITULAR_CREADO:     '+ Titular creado',
  OPERADOR_CREADO:    '+ Operador creado',
  OPERADOR_ELIMINADO: '− Operador eliminado',
  PLAZA_CREADA:       '+ Plaza creada',
  TENANT_CREADO:      '+ Tenant creado',
  TENANT_ELIMINADO:   '− Tenant eliminado',
  API_ERROR:          '⚠ Error de API',
}

export default async function SoportePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const ctx = await getSessionCtx()
  if (!ctx || ctx.usuario?.rol !== 'SUPERADMIN') redirect('/dashboard')

  const { id } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { id: true, nombre: true, slug: true, plan: true, activo: true },
  })
  if (!tenant) notFound()

  const [abonosRecientes, cuentasSeguimiento, operadores, auditLogs, statsClientes] = await Promise.all([
    prisma.abono.findMany({
      where: { tenantId: id },
      orderBy: { fecha: 'desc' },
      take: 15,
      include: {
        cuenta:   { select: { id: true, assigned_capital: true, cliente: { select: { nombre: true } } } },
        operador: { select: { nombre: true } },
      },
    }),
    prisma.cuenta.findMany({
      where: { tenantId: id, estado: 'SEGUIMIENTO' as any },
      orderBy: { fecha_proyectada: 'asc' },
      take: 10,
      include: { cliente: { select: { nombre: true } } },
    }),
    prisma.usuario.findMany({
      where: { tenantId: id, activo: true },
      select: { id: true, nombre: true, email: true, rol: true, plaza: { select: { nombre: true } } },
      orderBy: { nombre: 'asc' },
    }),
    prisma.auditLog.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.cliente.count({ where: { tenantId: id, activo: true } }),
  ])

  const labelCls = 'text-[9px] font-mono tracking-[2px] uppercase text-[#555] mb-3 pb-2 border-b border-[#111]'

  return (
    <div className="p-6 max-w-5xl">

      {/* Breadcrumb */}
      <Link
        href={`/superadmin/${id}`}
        className="flex items-center gap-1 text-[10px] font-mono text-[#555] hover:text-[#888] mb-6 transition-colors"
      >
        <ChevronLeft size={12} /> {tenant.nombre}
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <HeadphonesIcon size={14} className="text-[#d4af37]" />
        <div>
          <h1 className="font-serif text-xl text-[#e8e8e8]">Consola de Soporte</h1>
          <p className="text-[11px] font-mono text-[#555] mt-0.5">
            Vista de solo lectura · {tenant.nombre} · Plan {tenant.plan}
          </p>
        </div>
        <span className={`ml-auto text-[9px] font-mono px-2 py-0.5 border ${tenant.activo ? 'text-[#27ae60] border-[#27ae60]' : 'text-[#c0392b] border-[#c0392b]'}`}>
          {tenant.activo ? '● Activo' : '● Inactivo'}
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { icon: Users,         label: 'Titulares', value: statsClientes },
          { icon: Activity,      label: 'Abonos (recientes)', value: abonosRecientes.length },
          { icon: AlertTriangle, label: 'En Seguimiento',     value: cuentasSeguimiento.length },
          { icon: MapPin,        label: 'Operadores Activos', value: operadores.length },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="border border-[#1e1e1e] bg-[#0a0a0a] px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={11} className="text-[#555]" />
              <span className="text-[9px] font-mono tracking-[1px] uppercase text-[#555]">{label}</span>
            </div>
            <div className="text-2xl font-mono text-[#e8e8e8]">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Cuentas en seguimiento */}
        <div>
          <div className={labelCls}>Cuentas en Seguimiento ({cuentasSeguimiento.length})</div>
          {cuentasSeguimiento.length === 0 ? (
            <p className="text-[11px] font-mono text-[#333]">Sin cuentas en seguimiento.</p>
          ) : (
            <div className="border border-[#1e1e1e] divide-y divide-[#111]">
              {cuentasSeguimiento.map(c => (
                <div key={c.id} className="px-3 py-2.5">
                  <div className="text-[12px] font-mono text-[#e8e8e8]">{c.cliente.nombre}</div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-[9px] font-mono text-[#444]">
                      Vence: {new Date(c.fecha_proyectada).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[9px] font-mono text-[#c0392b]">
                      Saldo: ${Number(c.remaining_balance).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Operadores activos */}
        <div>
          <div className={labelCls}>Operadores Activos ({operadores.length})</div>
          {operadores.length === 0 ? (
            <p className="text-[11px] font-mono text-[#333]">Sin operadores.</p>
          ) : (
            <div className="border border-[#1e1e1e] divide-y divide-[#111]">
              {operadores.map(o => (
                <div key={o.id} className="px-3 py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-mono text-[#e8e8e8]">{o.nombre}</div>
                    <div className="text-[9px] font-mono text-[#444] mt-0.5">{o.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-mono text-[#555]">{o.rol}</div>
                    {o.plaza && (
                      <div className="text-[8px] font-mono text-[#333] mt-0.5">{o.plaza.nombre}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent abonos */}
      <div className="mb-6">
        <div className={labelCls}>Últimos Abonos ({abonosRecientes.length})</div>
        {abonosRecientes.length === 0 ? (
          <p className="text-[11px] font-mono text-[#333]">Sin abonos registrados.</p>
        ) : (
          <div className="border border-[#1e1e1e]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  {['Titular', 'Monto', 'Operador', 'Fecha'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-[9px] font-mono tracking-[2px] uppercase text-[#555]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {abonosRecientes.map((a, i) => (
                  <tr key={a.id} className={i % 2 === 1 ? 'bg-[#0d0d0d]' : ''}>
                    <td className="px-4 py-2.5 text-[11px] font-mono text-[#e8e8e8]">
                      {a.cuenta.cliente.nombre}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] font-mono text-[#27ae60]">
                      ${Number(a.monto).toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] font-mono text-[#888]">
                      {a.operador.nombre}
                    </td>
                    <td className="px-4 py-2.5 text-[9px] font-mono text-[#444]">
                      {new Date(a.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit log */}
      <div>
        <div className={labelCls}>Registro de Actividad ({auditLogs.length})</div>
        {auditLogs.length === 0 ? (
          <p className="text-[11px] font-mono text-[#333]">Sin registros aún — las acciones futuras aparecerán aquí.</p>
        ) : (
          <div className="border border-[#1e1e1e] divide-y divide-[#111]">
            {auditLogs.map(log => (
              <div key={log.id} className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <span className={`text-[10px] font-mono ${log.accion === 'API_ERROR' ? 'text-[#c0392b]' : 'text-[#888]'}`}>
                    {ACCION_LABEL[log.accion] ?? log.accion}
                  </span>
                  <span className="text-[9px] font-mono text-[#444] ml-2">{log.entidad} · {log.entidadId.slice(0, 8)}…</span>
                </div>
                <span className="text-[9px] font-mono text-[#333]">
                  {new Date(log.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
