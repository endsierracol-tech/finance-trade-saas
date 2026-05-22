import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionCtx } from '@/lib/session-context'
import { prisma } from '@/lib/prisma'
import { getLimits } from '@/lib/plan-limits'
import TenantEditPanel from './TenantEditPanel'
import { ChevronLeft, Building2, Users, CreditCard, HeadphonesIcon } from 'lucide-react'

const PLAN_COLOR: Record<string, string> = {
  AGIL:        '#27ae60',
  PROFESIONAL: '#d4af37',
  ENTERPRISE:  '#e67e22',
}

const ROL_LABEL: Record<string, string> = {
  SUPERADMIN:   'SuperAdmin',
  TENANT_ADMIN: 'Admin',
  PLAZA_ADMIN:  'Plaza Admin',
  ASESOR:       'Asesor',
  TITULAR:      'Titular',
}

function UsageBar({ label, current, limit }: { label: string; current: number; limit: number }) {
  const pct = limit >= 99999 ? 0 : Math.min(100, Math.round((current / limit) * 100))
  const color = pct >= 90 ? '#c0392b' : pct >= 70 ? '#e67e22' : '#27ae60'
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] font-mono text-[#555] uppercase tracking-[1px]">{label}</span>
        <span className="text-[9px] font-mono text-[#888]">
          {limit >= 99999 ? `${current} / ∞` : `${current} / ${limit}`}
        </span>
      </div>
      {limit < 99999 && (
        <div className="h-1 bg-[#111] w-full">
          <div className="h-1 transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      )}
    </div>
  )
}

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const ctx = await getSessionCtx()
  if (!ctx || ctx.usuario?.rol !== 'SUPERADMIN') redirect('/dashboard')

  const { id } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      plazas:   { orderBy: { nombre: 'asc' } },
      usuarios: {
        select: { id: true, nombre: true, email: true, rol: true, activo: true, plazaId: true },
        orderBy: { nombre: 'asc' },
      },
      _count: {
        select: {
          cuentas:  { where: { estado: 'ACTIVA' as any } },
          clientes: true,
          abonos:   true,
        },
      },
    },
  })

  if (!tenant) notFound()

  const limits = getLimits(tenant.plan)
  const activePlazas    = tenant.plazas.filter(p => p.activa).length
  const activeUsuarios  = tenant.usuarios.filter(u => u.activo).length

  return (
    <div className="p-6 max-w-4xl">

      {/* Breadcrumb */}
      <Link
        href="/superadmin"
        className="flex items-center gap-1 text-[10px] font-mono text-[#555] hover:text-[#888] mb-6 transition-colors"
      >
        <ChevronLeft size={12} /> Tenants
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-xl text-[#e8e8e8]">{tenant.nombre}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] font-mono text-[#444]">{tenant.slug}</span>
            <span
              className="text-[9px] font-mono px-2 py-0.5"
              style={{
                color:  PLAN_COLOR[tenant.plan] ?? '#888',
                border: `1px solid ${PLAN_COLOR[tenant.plan] ?? '#333'}`,
              }}
            >
              {tenant.plan}
            </span>
            <span className={`text-[9px] font-mono ${tenant.activo ? 'text-[#27ae60]' : 'text-[#c0392b]'}`}>
              {tenant.activo ? '● Activo' : '● Inactivo'}
            </span>
          </div>
        </div>
        <Link
          href={`/superadmin/${id}/soporte`}
          className="flex items-center gap-2 px-3 py-1.5 border border-[#1e1e1e] text-[10px] font-mono text-[#888] hover:text-[#e8e8e8] hover:border-[#555] transition-colors"
        >
          <HeadphonesIcon size={11} />
          Soporte
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: Building2,  label: 'Plazas',          value: tenant.plazas.length },
          { icon: Users,      label: 'Usuarios',         value: tenant.usuarios.length },
          { icon: CreditCard, label: 'Cuentas Activas',  value: tenant._count.cuentas },
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

      {/* Usage vs limits */}
      <div className="border border-[#1e1e1e] bg-[#0a0a0a] px-5 py-4 mb-8 space-y-3">
        <div className="text-[9px] font-mono tracking-[2px] uppercase text-[#555] pb-2 border-b border-[#111]">
          Uso del Plan
        </div>
        <UsageBar label="Cuentas Activas"  current={tenant._count.cuentas} limit={limits.cuentas}   />
        <UsageBar label="Plazas Activas"   current={activePlazas}          limit={limits.plazas}    />
        <UsageBar label="Usuarios Activos" current={activeUsuarios}        limit={limits.usuarios}  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Users list */}
        <div>
          <div className="text-[9px] font-mono tracking-[2px] uppercase text-[#555] mb-3 pb-2 border-b border-[#111]">
            Usuarios
          </div>
          {tenant.usuarios.length === 0 ? (
            <p className="text-[11px] font-mono text-[#444]">Sin usuarios.</p>
          ) : (
            <div className="border border-[#1e1e1e] divide-y divide-[#111]">
              {tenant.usuarios.map(u => (
                <div key={u.id} className="px-3 py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-mono text-[#e8e8e8]">{u.nombre}</div>
                    <div className="text-[9px] font-mono text-[#444] mt-0.5">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-mono ${u.activo ? 'text-[#27ae60]' : 'text-[#555]'}`}>●</span>
                    <span className="text-[9px] font-mono text-[#555] border border-[#1e1e1e] px-2 py-0.5">
                      {ROL_LABEL[u.rol] ?? u.rol}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit panel */}
        <TenantEditPanel
          tenantId={tenant.id}
          initialNombre={tenant.nombre}
          initialPlan={tenant.plan}
          initialActivo={tenant.activo}
          initialColor={tenant.colorPrimario}
          initialFechaCorte={tenant.fechaCorte}
        />

      </div>
    </div>
  )
}
