import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionCtx } from '@/lib/session-context'

async function guardSuperAdmin() {
  const ctx = await getSessionCtx()
  if (!ctx || ctx.usuario?.rol !== 'SUPERADMIN') return null
  return ctx
}

export async function GET() {
  try {
    const ctx = await guardSuperAdmin()
    if (!ctx) return Response.json({ error: 'No autorizado' }, { status: 403 })

    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            plazas: true,
            usuarios: true,
            cuentas: { where: { estado: 'ACTIVA' as any } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return Response.json({ tenants })
  } catch {
    return Response.json({ error: 'Error al obtener tenants' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await guardSuperAdmin()
    if (!ctx) return Response.json({ error: 'No autorizado' }, { status: 403 })

    const { nombre, slug, plan, colorPrimario, adminNombre, adminEmail, adminPassword } =
      await request.json()

    if (!nombre || !slug || !plan || !adminNombre || !adminEmail || !adminPassword)
      return Response.json({ error: 'Todos los campos son requeridos' }, { status: 400 })

    if (adminPassword.length < 8)
      return Response.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })

    const existing = await prisma.tenant.findUnique({ where: { slug } })
    if (existing)
      return Response.json({ error: 'Ya existe un tenant con ese slug' }, { status: 409 })

    const admin = createAdminClient()
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    })
    if (authError)
      return Response.json({ error: authError.message }, { status: 400 })

    const tenant = await prisma.tenant.create({
      data: {
        nombre,
        slug,
        plan: plan as any,
        colorPrimario: colorPrimario ?? '#d4af37',
        usuarios: {
          create: {
            supabaseId: authData.user.id,
            nombre: adminNombre,
            email: adminEmail,
            rol: 'TENANT_ADMIN' as any,
          },
        },
      },
    })

    return Response.json({ tenant }, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002')
      return Response.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
    return Response.json({ error: 'Error al crear tenant' }, { status: 500 })
  }
}
