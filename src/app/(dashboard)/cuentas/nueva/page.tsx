'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calculator } from 'lucide-react'
import { calcularTotal, calcularCuota, calcularFechaProyectada, cuotasSugeridas, type PlanAbono } from '@/lib/cuenta-utils'

const inputCls =
  'w-full bg-[#030303] border border-[#2a2a2a] text-[#e8e8e8] text-xs font-mono px-4 py-2.5 outline-none focus:border-[rgba(212,175,55,0.4)] transition-colors placeholder:text-[#333]'

const readonlyCls =
  'w-full bg-[#0a0a0a] border border-[#1e1e1e] text-[#d4af37] text-xs font-mono px-4 py-2.5'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-2">
        {label}{required && <span className="text-[#d4af37] ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

const PLANES: { value: PlanAbono; label: string }[] = [
  { value: 'DIARIO',    label: 'Diario' },
  { value: 'SEMANAL',   label: 'Semanal' },
  { value: 'QUINCENAL', label: 'Quincenal' },
  { value: 'MENSUAL',   label: 'Mensual' },
]

export default function NuevaCuentaPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const titularParam = searchParams.get('titular') ?? ''

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    clienteId:        titularParam,
    assigned_capital: '',
    yield_rate:       '',
    plan_abono:       'DIARIO' as PlanAbono,
    n_cuotas:         '100',
    fecha_apertura:   today,
    notas:            '',
  })

  const [titular, setTitular]           = useState<{ nombre: string; identificacion: string } | null>(null)
  const [busqueda, setBusqueda]         = useState('')
  const [resultados, setResultados]     = useState<{ id: string; nombre: string; identificacion: string }[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  // Carga titular pre-seleccionado desde URL
  useEffect(() => {
    if (!titularParam) return
    fetch(`/api/titulares/${titularParam}`)
      .then(r => r.json())
      .then(d => { if (d.cliente) setTitular(d.cliente) })
  }, [titularParam])

  // Búsqueda de titulares con debounce
  useEffect(() => {
    if (busqueda.length < 2) { setResultados([]); return }
    const t = setTimeout(() => {
      fetch(`/api/titulares?q=${encodeURIComponent(busqueda)}`)
        .then(r => r.json())
        .then(d => setResultados(d.clientes ?? []))
    }, 300)
    return () => clearTimeout(t)
  }, [busqueda])

  const seleccionarTitular = useCallback((t: { id: string; nombre: string; identificacion: string }) => {
    setForm(p => ({ ...p, clienteId: t.id }))
    setTitular({ nombre: t.nombre, identificacion: t.identificacion })
    setBusqueda('')
    setResultados([])
    setShowDropdown(false)
  }, [])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  // Al cambiar plan, sugerir número de cuotas
  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const plan = e.target.value as PlanAbono
    setForm(p => ({ ...p, plan_abono: plan, n_cuotas: String(cuotasSugeridas(plan)) }))
  }

  // Cálculos en tiempo real
  const capital = parseFloat(form.assigned_capital) || 0
  const tasa    = parseFloat(form.yield_rate) || 0
  const cuotas  = parseInt(form.n_cuotas) || 0
  const total   = calcularTotal(capital, tasa)
  const cuota   = calcularCuota(total, cuotas)
  const fechaProyectada = (capital > 0 && cuotas > 0 && form.fecha_apertura)
    ? calcularFechaProyectada(new Date(form.fecha_apertura + 'T00:00:00'), form.plan_abono, cuotas)
    : null

  const fmt = (n: number) =>
    n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clienteId) { setError('Selecciona un titular'); return }
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/cuentas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al crear cuenta'); setLoading(false); return }
      router.push(form.clienteId ? `/titulares/${form.clienteId}` : '/cuentas')
      router.refresh()
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  const backHref = titularParam ? `/titulares/${titularParam}` : '/cuentas'

  return (
    <div className="p-6 max-w-2xl">

      <div className="mb-6">
        <Link href={backHref} className="flex items-center gap-1.5 text-[10px] font-mono text-[#555] hover:text-[#888] transition-colors mb-4">
          <ArrowLeft size={11} /> Volver
        </Link>
        <h1 className="font-serif text-2xl text-[#e8e8e8]">Nueva Cuenta de Capital</h1>
        <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
          Apertura de cuenta
        </p>
      </div>

      <form onSubmit={handleSubmit} className="border border-[#1e1e1e] bg-[#0d0d0d] p-6 space-y-5">

        {/* Titular */}
        <Field label="Titular" required>
          {titular ? (
            <div className="flex items-center justify-between border border-[#2a2a2a] bg-[#030303] px-4 py-2.5">
              <div>
                <span className="text-xs font-mono text-[#e8e8e8]">{titular.nombre}</span>
                <span className="text-[10px] font-mono text-[#555] ml-3">{titular.identificacion}</span>
              </div>
              {!titularParam && (
                <button type="button" onClick={() => { setTitular(null); setForm(p => ({ ...p, clienteId: '' })) }}
                  className="text-[9px] font-mono text-[#555] hover:text-[#888]">cambiar</button>
              )}
            </div>
          ) : (
            <div className="relative">
              <input
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Buscar por nombre o identificación..."
                className={inputCls}
              />
              {showDropdown && resultados.length > 0 && (
                <div className="absolute z-10 w-full border border-[#2a2a2a] bg-[#0d0d0d] mt-0.5 max-h-40 overflow-y-auto">
                  {resultados.map(t => (
                    <button key={t.id} type="button"
                      onMouseDown={() => seleccionarTitular(t)}
                      className="w-full text-left px-4 py-2 hover:bg-[#111] text-xs font-mono text-[#e8e8e8] border-b border-[#1e1e1e] last:border-0"
                    >
                      {t.nombre} <span className="text-[#555]">· {t.identificacion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Capital asignado ($)" required>
            <input value={form.assigned_capital} onChange={set('assigned_capital')} required
              type="number" min="0" step="1000" placeholder="500000" className={inputCls} />
          </Field>
          <Field label="Tasa de rendimiento (%)" required>
            <input value={form.yield_rate} onChange={set('yield_rate')} required
              type="number" min="0" max="100" step="0.1" placeholder="20" className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Modalidad" required>
            <select value={form.plan_abono} onChange={handlePlanChange} required className={inputCls}>
              {PLANES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="N° de cuotas" required>
            <input value={form.n_cuotas} onChange={set('n_cuotas')} required
              type="number" min="1" step="1" placeholder="100" className={inputCls} />
          </Field>
        </div>

        {/* Resultados calculados */}
        {capital > 0 && tasa > 0 && cuotas > 0 && (
          <div className="border border-[rgba(212,175,55,0.15)] bg-[rgba(212,175,55,0.03)] p-4 space-y-3">
            <div className="flex items-center gap-2 text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-3">
              <Calculator size={10} /> Resumen calculado
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[9px] font-mono text-[#555] uppercase tracking-wider mb-1">Cuota {form.plan_abono.toLowerCase()}</div>
                <div className="text-[15px] font-mono text-[#d4af37]">${fmt(cuota)}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-[#555] uppercase tracking-wider mb-1">Total a retornar</div>
                <div className="text-[15px] font-mono text-[#d4af37]">${fmt(total)}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-[#555] uppercase tracking-wider mb-1">Rendimiento</div>
                <div className="text-[13px] font-mono text-[#888]">${fmt(total - capital)}</div>
              </div>
              {fechaProyectada && (
                <div>
                  <div className="text-[9px] font-mono text-[#555] uppercase tracking-wider mb-1">Fecha proyectada</div>
                  <div className="text-[13px] font-mono text-[#888]">
                    {fechaProyectada.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              )}
            </div>
            {form.plan_abono === 'DIARIO' && (
              <p className="text-[9px] font-mono text-[#555]">* Los domingos no se cuentan como días de cobro</p>
            )}
          </div>
        )}

        <Field label="Fecha de apertura" required>
          <input value={form.fecha_apertura} onChange={set('fecha_apertura')} required
            type="date" className={inputCls} />
        </Field>

        <Field label="Notas">
          <textarea value={form.notas} onChange={set('notas')}
            placeholder="Observaciones opcionales..."
            rows={2}
            className={inputCls + ' resize-none'} />
        </Field>

        {error && (
          <p className="text-xs text-[#c0392b] border border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.05)] px-3 py-2 font-mono">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 font-mono text-xs tracking-[3px] uppercase border border-[rgba(212,175,55,0.4)] text-[#d4af37] bg-[rgba(212,175,55,0.06)] hover:bg-[rgba(212,175,55,0.12)] transition-colors disabled:opacity-40"
          >
            {loading ? 'Guardando...' : 'Abrir Cuenta'}
          </button>
          <Link href={backHref}
            className="px-6 py-2.5 font-mono text-xs tracking-wider border border-[#1e1e1e] text-[#555] hover:text-[#888] transition-colors"
          >
            Cancelar
          </Link>
        </div>

      </form>
    </div>
  )
}
