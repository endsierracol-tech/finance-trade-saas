import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

    const body   = await request.json()
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return Response.json({ error: 'Tenant no encontrado' }, { status: 404 })

    const allowed = ['nombre', 'colorPrimario']
    const data: Record<string, string> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    const updated = await prisma.tenant.update({ where: { id: tenant.id }, data })
    return Response.json({ tenant: updated })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Error al actualizar configuración' }, { status: 500 })
  }
}
