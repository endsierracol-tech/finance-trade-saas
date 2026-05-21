import { prisma } from '@/lib/prisma'
import { getSessionCtx, plazaCuentaFilter, plazaAbonoFilter } from '@/lib/session-context'
import PlazaFilter from '@/components/PlazaFilter'
import CalendarioClient, { type DayInfo } from './CalendarioClient'

const INTERVALS: Record<string, number> = {
  DIARIO: 1, SEMANAL: 7, QUINCENAL: 15, MENSUAL: 30,
}

function startOfDayMs(d: Date): number {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy.getTime()
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isScheduledOnDay(
  planAbono: string,
  fechaApertura: Date,
  fechaProyectada: Date | null,
  target: Date,
): boolean {
  if (target.getDay() === 0) return false // sin cobros los domingos
  const interval = INTERVALS[planAbono] ?? 1
  const diffDays = Math.round((startOfDayMs(target) - startOfDayMs(fechaApertura)) / 86400000)
  if (diffDays < 0) return false
  if (fechaProyectada && startOfDayMs(target) > startOfDayMs(fechaProyectada)) return false
  return diffDays % interval === 0
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; plaza?: string }>
}) {
  const { year: yearStr, month: monthStr, plaza: plazaFilter = '' } = await searchParams
  const ctx    = await getSessionCtx()
  const tenant = ctx?.tenant ?? await prisma.tenant.findFirst()
  if (!tenant) return <div className="p-6 text-[#555] font-mono text-xs">Sin datos</div>

  const now   = new Date()
  const year  = parseInt(yearStr  ?? String(now.getFullYear()))
  const month = parseInt(monthStr ?? String(now.getMonth() + 1))

  // Grid boundaries (full weeks, Monday-first)
  const firstOfMonth = new Date(year, month - 1, 1)
  const lastOfMonth  = new Date(year, month, 0)

  const gridStart = new Date(firstOfMonth)
  const dow = gridStart.getDay()
  gridStart.setDate(gridStart.getDate() - (dow === 0 ? 6 : dow - 1))
  gridStart.setHours(0, 0, 0, 0)

  const gridEnd = new Date(lastOfMonth)
  const lastDow = gridEnd.getDay()
  gridEnd.setDate(gridEnd.getDate() + (lastDow === 0 ? 0 : 7 - lastDow))
  gridEnd.setHours(23, 59, 59, 999)

  const cuentaWhere = ctx?.isGestor
    ? plazaCuentaFilter(ctx)
    : plazaFilter ? { cliente: { plazaId: plazaFilter } } : {}

  const abonoWhere = ctx?.isGestor
    ? plazaAbonoFilter(ctx)
    : plazaFilter ? { cuenta: { cliente: { plazaId: plazaFilter } } } : {}

  const [todasPlazas, cuentas, abonos] = await Promise.all([
    !ctx?.isGestor
      ? prisma.plaza.findMany({
          where: { tenantId: tenant.id },
          select: { id: true, nombre: true, ciudad: true },
          orderBy: { nombre: 'asc' },
        })
      : Promise.resolve([]),
    prisma.cuenta.findMany({
      where: {
        tenantId: tenant.id,
        estado: { in: ['ACTIVA', 'SEGUIMIENTO'] },
        ...cuentaWhere,
      },
      select: {
        id: true,
        plan_abono: true,
        monto_abono: true,
        fecha_apertura: true,
        fecha_proyectada: true,
        cliente: {
          select: {
            nombre: true,
            plaza: { select: { nombre: true } },
          },
        },
      },
    }),
    prisma.abono.findMany({
      where: {
        tenantId: tenant.id,
        fecha: { gte: gridStart, lte: gridEnd },
        ...abonoWhere,
      },
      select: { cuentaId: true, fecha: true },
    }),
  ])

  // Abono lookup: "cuentaId|YYYY-MM-DD"
  const abonoSet = new Set<string>()
  for (const a of abonos) {
    abonoSet.add(`${a.cuentaId}|${dateToStr(new Date(a.fecha))}`)
  }

  // Build DayInfo[] for every cell in the grid
  const days: DayInfo[] = []
  const cursor = new Date(gridStart)
  while (cursor <= gridEnd) {
    const dateStr = dateToStr(cursor)
    const dayAccounts: DayInfo['accounts'] = []

    for (const c of cuentas) {
      const fechaProy = c.fecha_proyectada ? new Date(c.fecha_proyectada) : null
      if (isScheduledOnDay(c.plan_abono, new Date(c.fecha_apertura), fechaProy, cursor)) {
        dayAccounts.push({
          cuentaId:       c.id,
          clienteNombre:  c.cliente.nombre,
          plazaNombre:    c.cliente.plaza.nombre,
          planAbono:      c.plan_abono,
          montoAbono:     Number(c.monto_abono),
          cobrado:        abonoSet.has(`${c.id}|${dateStr}`),
        })
      }
    }

    days.push({ date: dateStr, inMonth: cursor.getMonth() === month - 1, accounts: dayAccounts })
    cursor.setDate(cursor.getDate() + 1)
  }

  const todayStr = dateToStr(now)

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#e8e8e8]">Calendario</h1>
          <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
            {ctx?.isGestor && ctx.plazaId
              ? 'Tu plaza'
              : plazaFilter && todasPlazas.find(p => p.id === plazaFilter)
                ? todasPlazas.find(p => p.id === plazaFilter)!.nombre
                : 'Todas las plazas'}
          </p>
        </div>
        {!ctx?.isGestor && todasPlazas.length > 1 && (
          <PlazaFilter plazas={todasPlazas} selected={plazaFilter} />
        )}
      </div>

      <CalendarioClient
        days={days}
        year={year}
        month={month}
        today={todayStr}
      />
    </div>
  )
}
