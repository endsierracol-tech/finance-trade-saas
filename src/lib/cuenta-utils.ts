export type PlanAbono = 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'

export function calcularTotal(capital: number, tasaPct: number): number {
  return capital * (1 + tasaPct / 100)
}

export function calcularCuota(total: number, nCuotas: number): number {
  if (nCuotas <= 0) return 0
  return total / nCuotas
}

// Calcula la fecha proyectada de cierre, skipping domingos en DIARIO
export function calcularFechaProyectada(
  fechaApertura: Date,
  plan: PlanAbono,
  nCuotas: number
): Date {
  const date = new Date(fechaApertura)

  switch (plan) {
    case 'DIARIO': {
      let counted = 0
      while (counted < nCuotas) {
        date.setDate(date.getDate() + 1)
        if (date.getDay() !== 0) counted++ // 0 = domingo
      }
      break
    }
    case 'SEMANAL':
      date.setDate(date.getDate() + nCuotas * 7)
      break
    case 'QUINCENAL':
      date.setDate(date.getDate() + nCuotas * 15)
      break
    case 'MENSUAL':
      date.setMonth(date.getMonth() + nCuotas)
      break
  }

  return date
}

export function cuotasSugeridas(plan: PlanAbono): number {
  switch (plan) {
    case 'DIARIO':    return 100
    case 'SEMANAL':   return 20
    case 'QUINCENAL': return 10
    case 'MENSUAL':   return 12
  }
}
