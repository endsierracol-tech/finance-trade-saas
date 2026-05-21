import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { getSessionCtx } from '@/lib/session-context'
import NegocioForm from './NegocioForm'
import PlazasSection from './PlazasSection'

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const ctx = await getSessionCtx()

  const tenant = ctx?.tenant
    ? await prisma.tenant.findUnique({ where: { id: ctx.tenant.id } })
    : await prisma.tenant.findFirst()

  // ADMIN ve todas las plazas; GESTOR solo ve la suya
  const plazas = tenant
    ? await prisma.plaza.findMany({
        where: {
          tenantId: tenant.id,
          ...(ctx?.isGestor && ctx.plazaId ? { id: ctx.plazaId } : {}),
        },
        orderBy: { nombre: 'asc' },
      })
    : []

  const operador = tenant && user
    ? await prisma.usuario.findFirst({ where: { tenantId: tenant.id, supabaseId: user.id } })
    : null

  const isGestor = ctx?.isGestor ?? false

  return (
    <div className="p-6 max-w-2xl space-y-8">

      <div>
        <h1 className="font-serif text-2xl text-[#e8e8e8]">Configuración</h1>
        <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
          Ajustes del sistema
        </p>
      </div>

      {/* Negocio */}
      <section>
        <div className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-3">Negocio</div>
        <NegocioForm
          nombre={tenant?.nombre ?? ''}
          plan={tenant?.plan ?? ''}
          canEdit={!isGestor}
        />
      </section>

      {/* Plazas */}
      <section>
        <div className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-3">
          {isGestor ? 'Mi Plaza' : 'Plazas'}
        </div>
        <PlazasSection
          initialPlazas={plazas.map(p => ({ id: p.id, nombre: p.nombre, ciudad: p.ciudad }))}
          readOnly={isGestor}
        />
      </section>

      {/* Mi perfil */}
      <section>
        <div className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-3">Mi perfil</div>
        <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-5 space-y-4">
          <Row label="Nombre"  value={operador?.nombre ?? user?.email?.split('@')[0] ?? '—'} />
          <Row label="Email"   value={user?.email ?? '—'} />
          <Row label="Rol"     value={operador?.rol ?? '—'} />
          <Row label="ID Auth" value={user?.id ? user.id.slice(0, 8) + '...' : '—'} />
        </div>
      </section>

    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-mono tracking-[1.5px] text-[#555] uppercase">{label}</span>
      <span className="text-[12px] font-mono text-[#888]">{value}</span>
    </div>
  )
}
