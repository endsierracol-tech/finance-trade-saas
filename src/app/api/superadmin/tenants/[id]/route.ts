import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionCtx } from '@/lib/session-context'
import { logAudit } from '@/lib/audit'

async function guardSuperAdmin() {
  const ctx = await getSessionCtx()
  if (!ctx || ctx.usuario?.rol !== 'SUPERADMIN') return null
  return ctx
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await guardSuperAdmin()
    if (!ctx) return Response.json({ error: 'No autorizado' }, { status: 403 })

    const { id } = await params
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        plazas: { orderBy: { nombre: 'asc' } },
        usuarios: {
          select: { id: true, nombre: true, email: true, rol: true, activo: true, plazaId: true },
          orderBy: { nombre: 'asc' },
        },
        _count: {
          select: {
            cuentas: { where: { estado: 'ACTIVA' as any } },
          },
        },
      },
    })

    if (!tenant) return Response.json({ error: 'Tenant no encontrado' }, { status: 404 })
    return Response.json({ tenant })
  } catch {
    return Response.json({ error: 'Error al obtener tenant' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await guardSuperAdmin()
    if (!ctx) return Response.json({ error: 'No autorizado' }, { status: 403 })

    const { id } = await params
    const body = await request.json()
    const { nombre, plan, activo, colorPrimario, fechaCorte } = body

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(nombre      !== undefined && { nombre }),
        ...(plan        !== undefined && { plan: plan as any }),
        ...(activo      !== undefined && { activo }),
        ...(colorPrimario !== undefined && { colorPrimario }),
        ...(fechaCorte  !== undefined && { fechaCorte: Number(fechaCorte) }),
      },
    })

    return Response.json({ tenant })
  } catch {
    return Response.json({ error: 'Error al actualizar tenant' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await guardSuperAdmin()
    if (!ctx) return Response.json({ error: 'No autorizado' }, { status: 403 })

    const { id } = await params

    // Get all Supabase user IDs to delete from Auth
    const usuarios = await prisma.usuario.findMany({
      where: { tenantId: id },
      select: { supabaseId: true },
    })

    const admin = createAdminClient()
    await Promise.all(
      usuarios.map(u => admin.auth.admin.deleteUser(u.supabaseId))
    )

    await prisma.tenant.delete({ where: { id } })

    if (ctx.usuario) {
      await logAudit({
        tenantId:  ctx.tenant.id,
        usuarioId: ctx.usuario.id,
        accion:    'TENANT_ELIMINADO',
        entidad:   'Tenant',
        entidadId: id,
        detalle:   { usuariosEliminados: usuarios.length },
      })
    }

    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Error al eliminar tenant' }, { status: 500 })
  }
}
