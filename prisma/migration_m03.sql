-- M03: Cuentas de Capital
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar MENSUAL al enum PlanAbono
ALTER TYPE "PlanAbono" ADD VALUE IF NOT EXISTS 'MENSUAL';

-- 2. Agregar columna n_cuotas a Cuenta
ALTER TABLE "Cuenta" ADD COLUMN IF NOT EXISTS "n_cuotas" INTEGER NOT NULL DEFAULT 0;
