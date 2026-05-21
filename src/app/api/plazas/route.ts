import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateDevTenant } from '@/lib/dev-setup'

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return Response.json({ plazas: [] })
    const plazas = await prisma.plaza.findMany({
      where: { tenantId: tenant.id },
      orderBy: { nombre: 'asc' },
    })
    return Response.json({ plazas })
  } catch {
    return Response.json({ error: 'Error al obtener plazas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

    const { nombre, ciudad } = await request.json()
    if (!nombre || !ciudad) {
      return Response.json({ error: 'Nombre y ciudad son requeridos' }, { status: 400 })
    }

    const tenant = await getOrCreateDevTenant()
    const plaza  = await prisma.plaza.create({
      data: { tenantId: tenant.id, nombre, ciudad },
    })
    return Response.json({ plaza }, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Error al crear plaza' }, { status: 500 })
  }
}
