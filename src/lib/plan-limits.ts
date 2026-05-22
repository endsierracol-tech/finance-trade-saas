import { prisma } from './prisma'

export const PLAN_LIMITS = {
  AGIL:        { cuentas: 500,   plazas: 2,   usuarios: 10  },
  PROFESIONAL: { cuentas: 2000,  plazas: 5,   usuarios: 25  },
  ENTERPRISE:  { cuentas: 99999, plazas: 999, usuarios: 999 },
} as const

export const PLAN_MRR: Record<string, number> = {
  AGIL:        49,
  PROFESIONAL: 99,
  ENTERPRISE:  199,
}

export type PlanResource = 'cuentas' | 'plazas' | 'usuarios'

export function getLimits(plan: string) {
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.AGIL
}

export async function checkPlanLimit(
  tenantId: string,
  plan: string,
  resource: PlanResource,
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limit = getLimits(plan)[resource]

  let current = 0
  if (resource === 'cuentas') {
    current = await prisma.cuenta.count({
      where: { tenantId, estado: 'ACTIVA' as any },
    })
  } else if (resource === 'plazas') {
    current = await prisma.plaza.count({ where: { tenantId, activa: true } })
  } else {
    current = await prisma.usuario.count({ where: { tenantId, activo: true } })
  }

  return { allowed: current < limit, current, limit }
}

/** Compute the next billing renewal date from a fechaCorte (day of month 1-28) */
export function nextRenewalDate(fechaCorte: number): Date {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()
  return d <= fechaCorte
    ? new Date(y, m, fechaCorte)
    : new Date(y, m + 1, fechaCorte)
}
