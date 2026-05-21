import { prisma } from './prisma'
import { createClient } from './supabase/server'

export type SessionCtx = {
  tenant: { id: string; nombre: string; plan: string }
  usuario: { id: string; rol: string; plazaId: string | null } | null
  /** true when user is PLAZA_ADMIN or ASESOR — must be scoped to their plaza */
  isGestor: boolean
  plazaId: string | null
}

export async function getSessionCtx(): Promise<SessionCtx | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const tenant = await prisma.tenant.findFirst()
  if (!tenant) return null

  const usuario = await prisma.usuario.findFirst({
    where: { tenantId: tenant.id, supabaseId: user.id },
    select: { id: true, rol: true, plazaId: true },
  })

  const isGestor = !!(
    usuario &&
    usuario.rol !== 'TENANT_ADMIN' &&
    usuario.rol !== 'SUPERADMIN'
  )

  return {
    tenant: { id: tenant.id, nombre: tenant.nombre, plan: tenant.plan },
    usuario,
    isGestor,
    plazaId: usuario?.plazaId ?? null,
  }
}

/** Returns a Prisma `where` fragment to filter Clientes by plaza when scoped */
export function plazaClienteFilter(ctx: SessionCtx | null) {
  return ctx?.isGestor && ctx.plazaId ? { plazaId: ctx.plazaId } : {}
}

/** Returns a Prisma `where` fragment to filter Cuentas by plaza (via cliente) when scoped */
export function plazaCuentaFilter(ctx: SessionCtx | null) {
  return ctx?.isGestor && ctx.plazaId ? { cliente: { plazaId: ctx.plazaId } } : {}
}

/** Returns a Prisma `where` fragment to filter Abonos by plaza (via cuenta.cliente) when scoped */
export function plazaAbonoFilter(ctx: SessionCtx | null) {
  return ctx?.isGestor && ctx.plazaId ? { cuenta: { cliente: { plazaId: ctx.plazaId } } } : {}
}
