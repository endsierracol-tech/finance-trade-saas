import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionCtx } from '@/lib/session-context'
import { prisma } from '@/lib/prisma'
import { PLAN_MRR, getLimits, nextRenewalDate } from '@/lib/plan-limits'
import { Shield, Plus, TrendingUp, Building2, CreditCard, Users } from 'lucide-react'

const PLAN_COLOR: Record<string, string> = {
  AGIL:         '#27ae60',
  PROFESIONAL:  '#d4af37',
  ENTERPRISE:   '#e67e22',
}

export default async function SuperAdminPage() {
  const ctx = await getSessionCtx()
  if (!ctx || ctx.usuario?.rol !== 'SUPERADMIN') redirect('/dashboard')

  const tenants = await prisma.tenant.findMany({
    include: {
      _count: {
        select: {
          plazas:   true,
          usuarios: true,
          cuentas:  { where: { estado: 'ACTIVA' as any } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Global metrics
  const activos       = tenants.filter(t => t.activo)
  const mrr           = activos.reduce((s, t) => s + (PLAN_MRR[t.plan] ?? 0), 0)
  const totalCuentas  = tenants.reduce((s, t) => s + t._count.cuentas, 0)
  const totalUsuarios = tenants.reduce((s, t) => s + t._count.usuarios, 0)

  const planDist = (['AGIL', 'PROFESIONAL', 'ENTERPRISE'] as const).map(p => ({
    plan:  p,
    count: tenants.filter(t => t.plan === p).length,
  }))

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={13} className="text-[#d4af37]" />
            <span className="text-[9px] font-mono tracking-[2px] uppercase text-[#555]">END SIERRA · Command Center</span>
          </div>
          <h1 className="font-serif text-xl text-[#e8e8e8]">SuperAdmin</h1>
        </div>
        <Link
          href="/superadmin/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-[#d4af37] text-[#040404] text-[11px] font-mono font-bold tracking-[1px] uppercase hover:bg-[#c9a227] transition-colors"
        >
          <Plus size={12} />
          Nuevo Tenant
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { icon: TrendingUp,  label: 'MRR Estimado',    value: `$${mrr}`,          sub: 'USD / mes' },
          { icon: Building2,   label: 'Tenants Activos', value: activos.length,      sub: `de ${tenants.length} total` },
          { icon: CreditCard,  label: 'Cuentas Activas', value: totalCuentas,        sub: 'en todos los tenants' },
          { icon: Users,       label: 'Usuarios',        value: totalUsuarios,       sub: 'en todos los tenants' },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="border border-[#1e1e1e] bg-[#0a0a0a] px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={11} className="text-[#555]" />
              <span className="text-[9px] font-mono tracking-[1px] uppercase text-[#555]">{label}</span>
            </div>
            <div className="text-2xl font-mono text-[#e8e8e8]">{value}</div>
            <div className="text-[9px] font-mono text-[#333] mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      <div className="border border-[#1e1e1e] bg-[#0a0a0a] px-5 py-4 mb-8">
        <div className="text-[9px] font-mono tracking-[2px] uppercase text-[#555] mb-4">Distribución de Planes</div>
        <div className="grid grid-cols-3 gap-4">
          {planDist.map(({ plan, count }) => (
            <div key={plan} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PLAN_COLOR[plan] }} />
                <span className="text-[10px] font-mono text-[#888]">{plan}</span>
              </div>
              <div className="text-right">
                <span className="text-[14px] font-mono" style={{ color: PLAN_COLOR[plan] }}>{count}</span>
                <span className="text-[9px] font-mono text-[#333] ml-1">
                  · ${PLAN_MRR[plan] * count}/mes
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tenant table */}
      {tenants.length === 0 ? (
        <div className="border border-[#1e1e1e] p-12 text-center">
          <p className="text-[12px] font-mono text-[#555]">No hay tenants registrados.</p>
          <Link href="/superadmin/nuevo" className="inline-block mt-3 text-[11px] font-mono text-[#d4af37] hover:text-[#e8e8e8] transition-colors">
            Crear el primero →
          </Link>
        </div>
      ) : (
        <>
          <div className="text-[9px] font-mono tracking-[2px] uppercase text-[#555] mb-3">{tenants.length} tenant{tenants.length !== 1 ? 's' : ''}</div>
          <div className="border border-[#1e1e1e]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  {['Tenant', 'Plan', 'Plazas', 'Usuarios', 'Cuentas', 'Corte', 'Estado', ''].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-[9px] font-mono tracking-[2px] uppercase text-[#555]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map((t, i) => {
                  const limits = getLimits(t.plan)
                  const cuentasPct = limits.cuentas < 99999
                    ? Math.round((t._count.cuentas / limits.cuentas) * 100)
                    : 0
                  const renewal = nextRenewalDate(t.fechaCorte)
                  const daysLeft = Math.ceil((renewal.getTime() - Date.now()) / 86_400_000)
                  return (
                    <tr key={t.id} className={i % 2 === 1 ? 'bg-[#0d0d0d]' : ''}>
                      <td className="px-4 py-3">
                        <div className="text-[12px] font-mono text-[#e8e8e8]">{t.nombre}</div>
                        <div className="text-[9px] font-mono text-[#444] mt-0.5">{t.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[9px] font-mono px-2 py-0.5"
                          style={{ color: PLAN_COLOR[t.plan] ?? '#888', border: `1px solid ${PLAN_COLOR[t.plan] ?? '#333'}` }}
                        >
                          {t.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-mono text-[#888]">{t._count.plazas}</td>
                      <td className="px-4 py-3 text-[12px] font-mono text-[#888]">{t._count.usuarios}</td>
                      <td className="px-4 py-3">
                        <div className="text-[12px] font-mono text-[#888]">{t._count.cuentas}</div>
                        {limits.cuentas < 99999 && (
                          <div className="text-[8px] font-mono mt-0.5" style={{ color: cuentasPct >= 90 ? '#c0392b' : cuentasPct >= 70 ? '#e67e22' : '#555' }}>
                            {cuentasPct}% usado
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[10px] font-mono text-[#888]">día {t.fechaCorte}</div>
                        <div className={`text-[8px] font-mono mt-0.5 ${daysLeft <= 5 ? 'text-[#e67e22]' : 'text-[#444]'}`}>
                          en {daysLeft}d
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-mono ${t.activo ? 'text-[#27ae60]' : 'text-[#c0392b]'}`}>
                          {t.activo ? '● Activo' : '● Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/superadmin/${t.id}`}
                          className="text-[10px] font-mono text-[#d4af37] hover:text-[#e8e8e8] transition-colors"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
