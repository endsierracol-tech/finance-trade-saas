import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const g = globalThis as unknown as { prisma: PrismaClient; pgPool: Pool }

const pool = g.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL })
if (process.env.NODE_ENV !== 'production') g.pgPool = pool

const adapter = new PrismaPg(pool)

export const prisma =
  g.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') g.prisma = prisma
