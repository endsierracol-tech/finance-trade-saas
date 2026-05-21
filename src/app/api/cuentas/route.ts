import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateDevTenant, getOrCreateDevOperador } from '@/lib/dev-setup'
import { calcularFechaProyectada, type PlanAbono } from '@/lib/cuenta-utils'
import { getSessionCtx, plazaCuentaFilter } from '@/lib/session-context'

export async function GET(request: NextRequest) {
  try {
    const ctx = await getSessionCtx()
    const tenant = ctx?.tenant ?? await prisma.tenant.findFirst()
    if (!tenant) return Response.json({ cuentas: [] })

    const clienteId = request.nextUrl.searchParams.get('clienteId') ?? ''

    const cuentas = await prisma.cuenta.findMany({
      where: {
        tenantId: tenant.id,
        ...plazaCuentaFilter(ctx),
        ...(clienteId ? { clienteId } : {}),
      },
      include: { cliente: true },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ cuentas })
  } catch {
    return Response.json({ error: 'Error al obtener cuentas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const {
      clienteId, assigned_capital, yield_rate,
      plan_abono, n_cuotas, fecha_apertura, notas,
    } = body

    if (!clienteId || !assigned_capital || yield_rate === undefined || yield_rate === '' || !plan_abono || !n_cuotas) {
      return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const tenant   = await getOrCreateDevTenant()
    const operador = await getOrCreateDevOperador(user.id, tenant.id, user.email ?? '')

    const capital  = parseFloat(assigned_capital)
    const tasaPct  = parseFloat(yield_rate)
    const cuotas   = parseInt(n_cuotas)

    const total_a_retornar = capital * (1 + tasaPct / 100)
    const monto_abono      = total_a_retornar / cuotas

    const apertura         = fecha_apertura ? new Date(fecha_apertura + 'T00:00:00') : new Date()
    const fecha_proyectada = calcularFechaProyectada(apertura, plan_abono as PlanAbono, cuotas)

    const cuenta = await prisma.cuenta.create({
      data: {
        tenantId:         tenant.id,
        clienteId,
        operadorId:       operador.id,
        assigned_capital: capital,
        yield_rate:       tasaPct / 100,
        total_a_retornar,
        plan_abono:       plan_abono as any,
        n_cuotas:         cuotas,
        monto_abono,
        remaining_balance: total_a_retornar,
        fecha_apertura:   apertura,
        fecha_proyectada,
        notas:            notas || null,
      },
      include: { cliente: true },
    })

    return Response.json({ cuenta }, { status: 201 })
  } catch (err: unknown) {
    console.error(err)
    return Response.json({ error: 'Error al crear cuenta' }, { status: 500 })
  }
}
