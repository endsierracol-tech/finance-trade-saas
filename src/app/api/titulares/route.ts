import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateDevTenant } from '@/lib/dev-setup'
import { getSessionCtx, plazaClienteFilter } from '@/lib/session-context'

export async function GET(request: NextRequest) {
  try {
    const ctx = await getSessionCtx()
    const tenant = ctx?.tenant ?? await prisma.tenant.findFirst()
    if (!tenant) return Response.json({ clientes: [] })

    const q = request.nextUrl.searchParams.get('q') ?? ''

    const clientes = await prisma.cliente.findMany({
      where: {
        tenantId: tenant.id,
        ...plazaClienteFilter(ctx),
        ...(q
          ? {
              OR: [
                { nombre: { contains: q, mode: 'insensitive' } },
                { identificacion: { contains: q, mode: 'insensitive' } },
                { telefono: { contains: q } },
              ],
            }
          : {}),
      },
      include: { plaza: true },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ clientes })
  } catch {
    return Response.json({ error: 'Error al obtener titulares' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, identificacion, telefono, direccion, referencia1, referencia2, plazaId } = body

    if (!nombre || !identificacion || !telefono || !direccion) {
      return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    if (!plazaId) {
      return Response.json({ error: 'Debes seleccionar una plaza' }, { status: 400 })
    }

    const tenant = await getOrCreateDevTenant()

    const plazaExists = await prisma.plaza.findFirst({ where: { id: plazaId, tenantId: tenant.id } })
    if (!plazaExists) {
      return Response.json({ error: 'Plaza no válida' }, { status: 400 })
    }

    const cliente = await prisma.cliente.create({
      data: {
        tenantId:       tenant.id,
        plazaId,
        nombre,
        identificacion,
        telefono,
        direccion,
        referencia1:    referencia1 || null,
        referencia2:    referencia2 || null,
      },
      include: { plaza: true },
    })

    return Response.json({ cliente }, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return Response.json({ error: 'Ya existe un titular con esa identificación' }, { status: 409 })
    }
    return Response.json({ error: 'Error al crear titular' }, { status: 500 })
  }
}
