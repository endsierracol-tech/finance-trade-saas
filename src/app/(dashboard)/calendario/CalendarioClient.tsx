'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export type DayAccount = {
  cuentaId:      string
  clienteNombre: string
  plazaNombre:   string
  planAbono:     string
  montoAbono:    number
  cobrado:       boolean
}

export type DayInfo = {
  date:     string   // YYYY-MM-DD
  inMonth:  boolean
  accounts: DayAccount[]
}

const PLAN_LABELS: Record<string, string> = {
  DIARIO: 'Diario', SEMANAL: 'Semanal', QUINCENAL: 'Quincenal', MENSUAL: 'Mensual',
}

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

const fmt = (n: number) => n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export default function CalendarioClient({
  days,
  year,
  month,
  today,
}: {
  days:  DayInfo[]
  year:  number
  month: number
  today: string
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  function navigateMonth(delta: number) {
    let m = month + delta
    let y = year
    if (m > 12) { m = 1;  y++ }
    if (m < 1)  { m = 12; y-- }
    const params = new URLSearchParams(searchParams.toString())
    params.set('year',  String(y))
    params.set('month', String(m))
    setSelectedDay(null)
    router.push(`${pathname}?${params.toString()}`)
  }

  const selectedData = selectedDay ? days.find(d => d.date === selectedDay) ?? null : null

  return (
    <div className="flex gap-4">

      {/* Calendar grid */}
      <div className="flex-1 min-w-0">

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1.5 text-[#555] hover:text-[#e8e8e8] transition-colors border border-[#1e1e1e] hover:border-[#333]"
          >
            <ChevronLeft size={13} />
          </button>
          <span className="text-[11px] font-mono tracking-[3px] text-[#888] uppercase">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 text-[#555] hover:text-[#e8e8e8] transition-colors border border-[#1e1e1e] hover:border-[#333]"
          >
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 mb-px">
          {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
            <div key={d} className="text-center text-[7px] font-mono tracking-[2px] text-[#444] uppercase py-2 border border-[#1e1e1e] border-b-0">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 border-l border-t border-[#1e1e1e]">
          {days.map(day => {
            const isToday    = day.date === today
            const isSelected = day.date === selectedDay
            const total      = day.accounts.length
            const cobrado    = day.accounts.filter(a => a.cobrado).length
            const pendiente  = total - cobrado
            const dayNum     = parseInt(day.date.split('-')[2])

            return (
              <div
                key={day.date}
                onClick={() => total > 0 && setSelectedDay(isSelected ? null : day.date)}
                className={[
                  'border-r border-b border-[#1e1e1e] p-2 min-h-[76px] transition-colors',
                  day.inMonth ? '' : 'opacity-25',
                  total > 0 ? 'cursor-pointer' : '',
                  isSelected ? 'bg-[rgba(212,175,55,0.06)]' : 'bg-[#0a0a0a] hover:bg-[#0f0f0f]',
                ].join(' ')}
              >
                {/* Day number */}
                <div className="mb-1.5">
                  {isToday ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-[#d4af37] text-[#000] text-[9px] font-mono rounded-full">
                      {dayNum}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#444]">{dayNum}</span>
                  )}
                </div>

                {/* Badges */}
                <div className="space-y-0.5">
                  {pendiente > 0 && (
                    <div className="text-[7.5px] font-mono leading-none px-1.5 py-1 border text-[#c0392b] bg-[rgba(192,57,43,0.08)] border-[rgba(192,57,43,0.2)]">
                      {pendiente} pend.
                    </div>
                  )}
                  {cobrado > 0 && (
                    <div className="text-[7.5px] font-mono leading-none px-1.5 py-1 border text-[#27ae60] bg-[rgba(39,174,96,0.08)] border-[rgba(39,174,96,0.2)]">
                      {cobrado} cobr.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-[rgba(192,57,43,0.4)] border border-[rgba(192,57,43,0.4)]" />
            <span className="text-[8px] font-mono text-[#555]">Pendiente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-[rgba(39,174,96,0.4)] border border-[rgba(39,174,96,0.4)]" />
            <span className="text-[8px] font-mono text-[#555]">Cobrado</span>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedData && (
        <div className="w-72 flex-shrink-0 border border-[#1e1e1e] bg-[#0a0a0a] flex flex-col">

          {/* Panel header */}
          <div className="flex items-start justify-between px-4 py-3 border-b border-[#1e1e1e]">
            <div>
              <div className="text-[11px] font-mono text-[#e8e8e8] capitalize">
                {new Date(selectedData.date + 'T12:00:00').toLocaleDateString('es-CO', {
                  weekday: 'long', day: '2-digit', month: 'long',
                })}
              </div>
              <div className="text-[8.5px] font-mono text-[#555] mt-0.5 tracking-wider">
                {selectedData.accounts.length} compromiso{selectedData.accounts.length !== 1 ? 's' : ''}
              </div>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-[#444] hover:text-[#888] transition-colors mt-0.5"
            >
              <X size={13} />
            </button>
          </div>

          {/* Account list */}
          <div className="flex-1 overflow-y-auto">
            {selectedData.accounts.map(a => (
              <div key={a.cuentaId} className="px-4 py-3 border-b border-[#111] flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-[#e8e8e8] truncate">{a.clienteNombre}</div>
                  <div className="text-[9px] font-mono text-[#555] mt-0.5">
                    {PLAN_LABELS[a.planAbono] ?? a.planAbono} · ${fmt(a.montoAbono)}
                  </div>
                  <div className="text-[8.5px] font-mono text-[#333] mt-0.5">{a.plazaNombre}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={[
                    'text-[7.5px] font-mono px-1.5 py-0.5 border',
                    a.cobrado
                      ? 'text-[#27ae60] bg-[rgba(39,174,96,0.08)] border-[rgba(39,174,96,0.2)]'
                      : 'text-[#c0392b] bg-[rgba(192,57,43,0.08)] border-[rgba(192,57,43,0.2)]',
                  ].join(' ')}>
                    {a.cobrado ? 'Cobrado' : 'Pendiente'}
                  </span>
                  <Link
                    href={`/cuentas/${a.cuentaId}`}
                    className="text-[9px] font-mono text-[#555] hover:text-[#d4af37] transition-colors"
                  >
                    Ver →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Panel footer totals */}
          <div className="px-4 py-3 border-t border-[#1e1e1e] bg-[#080808] space-y-1">
            <div className="flex justify-between">
              <span className="text-[8.5px] font-mono text-[#555]">Proyectado</span>
              <span className="text-[8.5px] font-mono text-[#888]">
                ${fmt(selectedData.accounts.reduce((s, a) => s + a.montoAbono, 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[8.5px] font-mono text-[#555]">Cobrado</span>
              <span className="text-[8.5px] font-mono text-[#27ae60]">
                ${fmt(selectedData.accounts.filter(a => a.cobrado).reduce((s, a) => s + a.montoAbono, 0))}
              </span>
            </div>
            {selectedData.accounts.some(a => !a.cobrado) && (
              <div className="flex justify-between">
                <span className="text-[8.5px] font-mono text-[#555]">Pendiente</span>
                <span className="text-[8.5px] font-mono text-[#c0392b]">
                  ${fmt(selectedData.accounts.filter(a => !a.cobrado).reduce((s, a) => s + a.montoAbono, 0))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
