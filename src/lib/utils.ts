import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = 'USD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// Calcula tabla de amortización para una cuenta de capital
export function calcularTablaAbonos(params: {
  assigned_capital: number
  yield_rate: number      // ej: 0.20 para 20%
  plan_abono: 'DIARIO' | 'SEMANAL' | 'QUINCENAL'
}): {
  total_a_retornar: number
  monto_abono: number
  num_cuotas: number
  fecha_proyectada: Date
} {
  const { assigned_capital, yield_rate, plan_abono } = params
  const total_a_retornar = assigned_capital * (1 + yield_rate)

  const diasPorPeriodo = { DIARIO: 1, SEMANAL: 7, QUINCENAL: 15 }
  // Convención estándar del sector: 30 días de cobro para plan diario
  const cuotasPorPlan = { DIARIO: 30, SEMANAL: 4, QUINCENAL: 2 }

  const num_cuotas = cuotasPorPlan[plan_abono]
  const monto_abono = Math.ceil(total_a_retornar / num_cuotas)
  const diasTotales = num_cuotas * diasPorPeriodo[plan_abono]

  const fecha_proyectada = new Date()
  fecha_proyectada.setDate(fecha_proyectada.getDate() + diasTotales)

  return { total_a_retornar, monto_abono, num_cuotas, fecha_proyectada }
}
