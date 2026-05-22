import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionCtx } from '@/lib/session-context'
import { checkPlanLimit } from '@/lib/plan-limits'
import { logAudit } from '@/lib/audit'

const ROLES_GESTION = ['PLAZA_ADMIN', 'ASESOR']

export async function GET() {
  try {
    const ctx = await getSessionCtx()
    if (!ctx) return Response.json({ error: 'No autenticado' }, { status: 401 })
    if (ctx.isGestor) return Response.json({ error: 'No autorizado' }, { status: 403 })

    const operadores = await prisma.usuario.findMany({
      where: {
        tenantId: ctx.tenant.id,
        rol: { in: ROLES_GESTION as any },
      },
      include: { plaza: true },
      orderBy: { nombre: 'asc' },
    })

    return Response.json({ operadores })
  } catch {
    return Response.json({ error: 'Error al obtener operadores' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getSessionCtx()
    if (!ctx) return Response.json({ error: 'No autenticado' }, { status: 401 })
    if (ctx.isGestor) return Response.json({ error: 'No autorizado' }, { status: 403 })

    const { nombre, email, password, rol, plazaId } = await request.json()

    if (!nombre || !email || !password || !rol || !plazaId) {
      return Response.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }
    if (!ROLES_GESTION.includes(rol)) {
      return Response.json({ error: 'Rol no válido' }, { status: 400 })
    }
    if (password.length < 8) {
      return Response.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const plazaValida = await prisma.plaza.findFirst({
      where: { id: plazaId, tenantId: ctx.tenant.id },
    })
    if (!plazaValida) {
      return Response.json({ error: 'Plaza no válida' }, { status: 400 })
    }

    const limitCheck = await checkPlanLimit(ctx.tenant.id, ctx.tenant.plan, 'usuarios')
    if (!limitCheck.allowed) {
      return Response.json({
        error: `Límite del plan alcanzado: ${limitCheck.current}/${limitCheck.limit} usuarios activos (Plan ${ctx.tenant.plan})`,
      }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError) {
      return Response.json({ error: authError.message }, { status: 400 })
    }

    const operador = await prisma.usuario.create({
      data: {
        tenantId:   ctx.tenant.id,
        supabaseId: authData.user.id,
        nombre,
        email,
        rol:        rol as any,
        plazaId,
      },
      include: { plaza: true },
    })

    if (ctx.usuario) {
      await logAudit({
        tenantId:  ctx.tenant.id,
        usuarioId: ctx.usuario.id,
        accion:    'OPERADOR_CREADO',
        entidad:   'Usuario',
        entidadId: operador.id,
        detalle:   { nombre, email, rol },
      })
    }

    return Response.json({ operador }, { status: 201 })
  } catch (err: any) {
    console.error(err)
    if (err?.code === 'P2002') {
      return Response.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
    }
    return Response.json({ error: 'Error al crear operador' }, { status: 500 })
  }
}
