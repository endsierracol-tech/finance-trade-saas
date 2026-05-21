import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateDevTenant, getOrCreateDevOperador } from '@/lib/dev-setup'
import { getSessionCtx, plazaAbonoFilter } from '@/lib/session-context'

export async function GET(request: NextRequest) {
  try {
    const ctx = await getSessionCtx()
    const tenant = ctx?.tenant ?? await prisma.tenant.findFirst()
    if (!tenant) return Response.json({ abonos: [] })

    const cuentaId = request.nextUrl.searchParams.get('cuentaId') ?? ''
    const limit    = parseInt(request.nextUrl.searchParams.get('limit') ?? '100')

    const abonos = await prisma.abono.findMany({
      where: {
        tenantId: tenant.id,
        ...plazaAbonoFilter(ctx),
        ...(cuentaId ? { cuentaId } : {}),
      },
      include: {
        cuenta: { include: { cliente: true } },
        operador: true,
      },
      orderBy: { fecha: 'desc' },
      take: limit,
    })

    return Response.json({ abonos })
  } catch {
    return Response.json({ error: 'Error al obtener abonos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { cuentaId, monto, fecha, notas, lat, lng } = body

    if (!cuentaId || !monto) {
      return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const tenant   = await getOrCreateDevTenant()
    const operador = await getOrCreateDevOperador(user.id, tenant.id, user.email ?? '')

    const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId } })
    if (!cuenta) return Response.json({ error: 'Cuenta no encontrada' }, { status: 404 })
    if (cuenta.estado === 'CERRADA') {
      return Response.json({ error: 'La cuenta ya está cerrada' }, { status: 400 })
    }

    const montoNum       = parseFloat(monto)
    const nuevoAbonado   = Number(cuenta.total_abonado) + montoNum
    const nuevoSaldo     = Number(cuenta.remaining_balance) - montoNum
    const cuentaCerrada  = nuevoSaldo <= 0

    const fechaAbono = fecha ? new Date(fecha + 'T12:00:00') : new Date()

    const [abono] = await prisma.$transaction([
      prisma.abono.create({
        data: {
          tenantId:  tenant.id,
          cuentaId,
          operadorId: operador.id,
          monto:     montoNum,
          fecha:     fechaAbono,
          notas:     notas || null,
          lat:       lat ?? null,
          lng:       lng ?? null,
        },
      }),
      prisma.cuenta.update({
        where: { id: cuentaId },
        data: {
          total_abonado:     nuevoAbonado,
          remaining_balance: Math.max(nuevoSaldo, 0),
          ...(cuentaCerrada ? { estado: 'CERRADA', fecha_cierre: new Date() } : {}),
        },
      }),
    ])

    return Response.json({ abono, cuentaCerrada }, { status: 201 })
  } catch (err: unknown) {
    console.error(err)
    return Response.json({ error: 'Error al registrar abono' }, { status: 500 })
  }
}
