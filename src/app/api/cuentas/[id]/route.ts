import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const cuenta = await prisma.cuenta.findUnique({
      where: { id },
      include: {
        cliente: { include: { plaza: true } },
        operador: true,
        abonos: { orderBy: { fecha: 'desc' } },
      },
    })
    if (!cuenta) return Response.json({ error: 'No encontrada' }, { status: 404 })
    return Response.json({ cuenta })
  } catch {
    return Response.json({ error: 'Error al obtener cuenta' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body   = await request.json()
    const cuenta = await prisma.cuenta.update({ where: { id }, data: body })
    return Response.json({ cuenta })
  } catch {
    return Response.json({ error: 'Error al actualizar cuenta' }, { status: 500 })
  }
}
