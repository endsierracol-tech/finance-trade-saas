-- Finance Trade SaaS — Initial Schema Migration
-- Ejecutar en: Supabase Dashboard → SQL Editor

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('SUPERADMIN', 'TENANT_ADMIN', 'PLAZA_ADMIN', 'ASESOR', 'TITULAR');

-- CreateEnum
CREATE TYPE "PlanAbono" AS ENUM ('DIARIO', 'SEMANAL', 'QUINCENAL');

-- CreateEnum
CREATE TYPE "EstadoCuenta" AS ENUM ('ACTIVA', 'SEGUIMIENTO', 'CERRADA');

-- CreateEnum
CREATE TYPE "PlanSuscripcion" AS ENUM ('AGIL', 'PROFESIONAL', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" "PlanSuscripcion" NOT NULL DEFAULT 'AGIL',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "logoUrl" TEXT,
    "colorPrimario" TEXT NOT NULL DEFAULT '#d4af37',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supabaseId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "plazaId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plaza" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plaza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "plazaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "identificacion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "referencia1" TEXT,
    "referencia2" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "operadorId" TEXT NOT NULL,
    "assigned_capital" DECIMAL(12,2) NOT NULL,
    "yield_rate" DECIMAL(5,4) NOT NULL,
    "total_a_retornar" DECIMAL(12,2) NOT NULL,
    "plan_abono" "PlanAbono" NOT NULL DEFAULT 'DIARIO',
    "monto_abono" DECIMAL(10,2) NOT NULL,
    "remaining_balance" DECIMAL(12,2) NOT NULL,
    "total_abonado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fecha_apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_proyectada" TIMESTAMP(3) NOT NULL,
    "fecha_cierre" TIMESTAMP(3),
    "estado" "EstadoCuenta" NOT NULL DEFAULT 'ACTIVA',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Abono" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "operadorId" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "notas" TEXT,

    CONSTRAINT "Abono_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "detalle" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_supabaseId_key" ON "Usuario"("supabaseId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_plazaId_fkey" FOREIGN KEY ("plazaId") REFERENCES "Plaza"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plaza" ADD CONSTRAINT "Plaza_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_plazaId_fkey" FOREIGN KEY ("plazaId") REFERENCES "Plaza"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuenta" ADD CONSTRAINT "Cuenta_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuenta" ADD CONSTRAINT "Cuenta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuenta" ADD CONSTRAINT "Cuenta_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
