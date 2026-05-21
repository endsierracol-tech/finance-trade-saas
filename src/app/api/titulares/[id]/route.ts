import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: { plaza: true, cuentas: true },
    })
    if (!cliente) return Response.json({ error: 'No encontrado' }, { status: 404 })
    return Response.json({ cliente })
  } catch {
    return Response.json({ error: 'Error al obtener titular' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const cliente = await prisma.cliente.update({ where: { id }, data: body })
    return Response.json({ cliente })
  } catch {
    return Response.json({ error: 'Error al actualizar titular' }, { status: 500 })
  }
}
