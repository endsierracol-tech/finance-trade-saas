import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionCtx } from '@/lib/session-context'

const ROLES_GESTION = ['PLAZA_ADMIN', 'ASESOR']

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getSessionCtx()
    if (!ctx) return Response.json({ error: 'No autenticado' }, { status: 401 })
    if (ctx.isGestor) return Response.json({ error: 'No autorizado' }, { status: 403 })

    const { id } = await params
    const operador = await prisma.usuario.findFirst({
      where: { id, tenantId: ctx.tenant.id },
      include: { plaza: true },
    })
    if (!operador) return Response.json({ error: 'No encontrado' }, { status: 404 })

    return Response.json({ operador })
  } catch {
    return Response.json({ error: 'Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getSessionCtx()
    if (!ctx) return Response.json({ error: 'No autenticado' }, { status: 401 })
    if (ctx.isGestor) return Response.json({ error: 'No autorizado' }, { status: 403 })

    const { id } = await params
    const body = await request.json()

    const operador = await prisma.usuario.findFirst({
      where: { id, tenantId: ctx.tenant.id },
    })
    if (!operador) return Response.json({ error: 'Operador no encontrado' }, { status: 404 })
    if (!ROLES_GESTION.includes(operador.rol)) {
      return Response.json({ error: 'No puedes editar este usuario' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.nombre  !== undefined) updateData.nombre  = body.nombre
    if (body.plazaId !== undefined) updateData.plazaId = body.plazaId
    if (body.activo  !== undefined) updateData.activo  = body.activo
    if (body.rol     !== undefined) {
      if (!ROLES_GESTION.includes(body.rol)) {
        return Response.json({ error: 'Rol no válido' }, { status: 400 })
      }
      updateData.rol = body.rol
    }

    const updated = await prisma.usuario.update({
      where: { id },
      data: updateData as any,
      include: { plaza: true },
    })

    return Response.json({ operador: updated })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Error al actualizar operador' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getSessionCtx()
    if (!ctx) return Response.json({ error: 'No autenticado' }, { status: 401 })
    if (ctx.isGestor) return Response.json({ error: 'No autorizado' }, { status: 403 })

    const { id } = await params

    const operador = await prisma.usuario.findFirst({
      where: { id, tenantId: ctx.tenant.id },
    })
    if (!operador) return Response.json({ error: 'Operador no encontrado' }, { status: 404 })
    if (!ROLES_GESTION.includes(operador.rol)) {
      return Response.json({ error: 'No puedes eliminar este usuario' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { error: authError } = await admin.auth.admin.deleteUser(operador.supabaseId)
    if (authError) {
      console.error('Supabase delete error:', authError)
    }

    await prisma.usuario.delete({ where: { id } })

    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Error al eliminar operador' }, { status: 500 })
  }
}
