import { prisma } from './prisma'

export type AuditAccion =
  | 'CUENTA_ABIERTA'
  | 'CUENTA_CERRADA'
  | 'ABONO_REGISTRADO'
  | 'TITULAR_CREADO'
  | 'OPERADOR_CREADO'
  | 'OPERADOR_ELIMINADO'
  | 'PLAZA_CREADA'
  | 'TENANT_CREADO'
  | 'TENANT_ELIMINADO'
  | 'API_ERROR'

export async function logAudit(params: {
  tenantId: string
  usuarioId: string
  accion: AuditAccion
  entidad: string
  entidadId: string
  detalle?: Record<string, unknown>
  ip?: string
}) {
  try {
    await prisma.auditLog.create({ data: { ...params, detalle: params.detalle as any } })
  } catch {
    // audit failure must never break the main flow
  }
}
