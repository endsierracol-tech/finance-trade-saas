import { prisma } from './prisma'

export async function getOrCreateDevTenant() {
  const existing = await prisma.tenant.findFirst()
  if (existing) return existing

  return prisma.tenant.create({
    data: {
      nombre: 'Empresa Principal',
      slug: 'empresa-principal',
      plan: 'PROFESIONAL',
    },
  })
}

export async function getOrCreateDevPlaza(tenantId: string) {
  const existing = await prisma.plaza.findFirst({ where: { tenantId } })
  if (existing) return existing

  return prisma.plaza.create({
    data: {
      tenantId,
      nombre: 'Plaza Principal',
      ciudad: 'Ciudad',
    },
  })
}

export async function getOrCreateDevOperador(
  supabaseId: string,
  tenantId: string,
  email: string
) {
  const existing = await prisma.usuario.findUnique({ where: { supabaseId } })
  if (existing) return existing

  return prisma.usuario.create({
    data: {
      tenantId,
      supabaseId,
      nombre: email.split('@')[0] ?? 'Administrador',
      email,
      rol: 'TENANT_ADMIN',
    },
  })
}
