// Tipos centrales del dominio Finance Trade
// Vocabulario enmascarado: nunca usar "préstamo", "deuda", "interés"

export type Rol = 'SUPERADMIN' | 'TENANT_ADMIN' | 'PLAZA_ADMIN' | 'ASESOR' | 'TITULAR'
export type PlanAbono = 'DIARIO' | 'SEMANAL' | 'QUINCENAL'
export type EstadoCuenta = 'ACTIVA' | 'SEGUIMIENTO' | 'CERRADA'
export type PlanSuscripcion = 'AGIL' | 'PROFESIONAL' | 'ENTERPRISE'

export interface UsuarioSesion {
  id: string
  tenantId: string
  nombre: string
  email: string
  rol: Rol
  plazaId?: string | null
}

export interface TenantConfig {
  id: string
  nombre: string
  slug: string
  plan: PlanSuscripcion
  logoUrl?: string | null
  colorPrimario: string
}

// Cuenta de Capital (vocabulario UI)
export interface ResumenCuenta {
  id: string
  titular: string
  assigned_capital: number
  remaining_balance: number
  total_a_retornar: number
  monto_abono: number
  plan_abono: PlanAbono
  estado: EstadoCuenta
  fecha_apertura: string
  fecha_proyectada: string
  diasAtraso: number
}

// Dashboard KPIs
export interface KPIsDashboard {
  cuentasActivas: number
  capitalEnPosicion: number
  abonosHoy: number
  montoRecaudadoHoy: number
  cuentasEnSeguimiento: number
  cuentasCerradasMes: number
}

// Ruta del día para Asesor
export interface RutaDelDia {
  cuentaId: string
  titular: string
  direccion: string
  lat?: number | null
  lng?: number | null
  montoAbono: number
  estadoCuenta: EstadoCuenta
  ultimoAbono?: string | null
  cobradoHoy: boolean
}
