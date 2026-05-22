import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionCtx } from '@/lib/session-context'
import { checkPlanLimit } from '@/lib/plan-limits'
import { logAudit } from '@/lib/audit'

export async function GET() {
  try {
    const ctx = await getSessionCtx()
    if (!ctx) return Response.json({ error: 'No autenticado' }, { status: 401 })

    const plazas = await prisma.plaza.findMany({
      where: { tenantId: ctx.tenant.id },
      orderBy: { nombre: 'asc' },
    })
    return Response.json({ plazas })
  } catch {
    return Response.json({ error: 'Error al obtener plazas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getSessionCtx()
    if (!ctx) return Response.json({ error: 'No autenticado' }, { status: 401 })
    if (ctx.isGestor) return Response.json({ error: 'No autorizado' }, { status: 403 })

    const { nombre, ciudad } = await request.json()
    if (!nombre || !ciudad) {
      return Response.json({ error: 'Nombre y ciudad son requeridos' }, { status: 400 })
    }

    const limitCheck = await checkPlanLimit(ctx.tenant.id, ctx.tenant.plan, 'plazas')
    if (!limitCheck.allowed) {
      return Response.json({
        error: `Límite del plan alcanzado: ${limitCheck.current}/${limitCheck.limit} plazas activas (Plan ${ctx.tenant.plan})`,
      }, { status: 403 })
    }

    const plaza = await prisma.plaza.create({
      data: { tenantId: ctx.tenant.id, nombre, ciudad },
    })

    if (ctx.usuario) {
      await logAudit({
        tenantId:  ctx.tenant.id,
        usuarioId: ctx.usuario.id,
        accion:    'PLAZA_CREADA',
        entidad:   'Plaza',
        entidadId: plaza.id,
        detalle:   { nombre, ciudad },
      })
    }

    return Response.json({ plaza }, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Error al crear plaza' }, { status: 500 })
  }
}
