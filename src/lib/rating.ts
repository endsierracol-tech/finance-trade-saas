export type RatingKey = 'EXCELENTE' | 'BUENO' | 'REGULAR' | 'INCONSISTENTE' | 'NULO'

export const RATING_CONFIG: Record<RatingKey, {
  label: string
  color: string
  bg: string
  border: string
  priority: number // 1 = mayor urgencia
}> = {
  NULO:          { label: 'Nulo',          color: '#555555', bg: 'rgba(85,85,85,0.08)',       border: 'rgba(85,85,85,0.25)',       priority: 1 },
  INCONSISTENTE: { label: 'Inconsistente', color: '#c0392b', bg: 'rgba(192,57,43,0.08)',      border: 'rgba(192,57,43,0.25)',      priority: 2 },
  REGULAR:       { label: 'Regular',       color: '#e67e22', bg: 'rgba(230,126,34,0.08)',     border: 'rgba(230,126,34,0.25)',     priority: 3 },
  BUENO:         { label: 'Bueno',         color: '#f1c40f', bg: 'rgba(241,196,15,0.08)',     border: 'rgba(241,196,15,0.25)',     priority: 4 },
  EXCELENTE:     { label: 'Excelente',     color: '#27ae60', bg: 'rgba(39,174,96,0.08)',      border: 'rgba(39,174,96,0.25)',      priority: 5 },
}

const INTERVALS: Record<string, number> = {
  DIARIO:    1,
  SEMANAL:   7,
  QUINCENAL: 15,
  MENSUAL:   30,
}

function startOfDay(d: Date): number {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy.getTime()
}

// fechaApertura se usa como referencia cuando no hay abonos registrados
export function calcRating(planAbono: string, lastAbonoFecha: Date | null, fechaApertura?: Date): RatingKey {
  const reference = lastAbonoFecha ?? fechaApertura ?? null
  if (!reference) return 'NULO'
  const daysSince = (startOfDay(new Date()) - startOfDay(reference)) / 86400000
  const interval  = INTERVALS[planAbono] ?? 1
  const cycles    = daysSince / interval

  if (cycles <= 1) return 'EXCELENTE'
  if (cycles <= 2) return 'BUENO'
  if (cycles <= 3) return 'REGULAR'
  if (cycles <= 5) return 'INCONSISTENTE'
  return 'NULO'
}

// Retorna true si la cuenta requiere cobro hoy (nextDue <= hoy)
export function isDueToday(planAbono: string, lastAbonoFecha: Date | null, fechaApertura: Date): boolean {
  const interval  = INTERVALS[planAbono] ?? 1
  const today     = startOfDay(new Date())
  const reference = lastAbonoFecha ?? fechaApertura
  const nextDue   = startOfDay(reference) + interval * 86400000
  return nextDue <= today
}

// Dado un array de {planAbono, lastAbono, fechaApertura?}, retorna el peor rating
export function worstRating(accounts: { planAbono: string; lastAbono: Date | null; fechaApertura?: Date }[]): RatingKey {
  if (accounts.length === 0) return 'NULO'
  const order: RatingKey[] = ['NULO', 'INCONSISTENTE', 'REGULAR', 'BUENO', 'EXCELENTE']
  let worst: RatingKey = 'EXCELENTE'
  for (const a of accounts) {
    const r = calcRating(a.planAbono, a.lastAbono, a.fechaApertura)
    if (order.indexOf(r) < order.indexOf(worst)) worst = r
  }
  return worst
}
