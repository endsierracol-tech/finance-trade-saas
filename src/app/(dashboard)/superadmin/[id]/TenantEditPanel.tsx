'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PLANES = ['AGIL', 'PROFESIONAL', 'ENTERPRISE'] as const
const PLAN_COLOR: Record<string, string> = {
  AGIL:        '#27ae60',
  PROFESIONAL: '#d4af37',
  ENTERPRISE:  '#e67e22',
}

function nextRenewalLabel(fechaCorte: number): string {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()
  const renewal = d <= fechaCorte
    ? new Date(y, m, fechaCorte)
    : new Date(y, m + 1, fechaCorte)
  const diff = Math.ceil((renewal.getTime() - today.getTime()) / 86_400_000)
  return `${renewal.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })} · en ${diff} día${diff !== 1 ? 's' : ''}`
}

interface Props {
  tenantId:       string
  initialNombre:  string
  initialPlan:    string
  initialActivo:  boolean
  initialColor:   string
  initialFechaCorte: number
}

export default function TenantEditPanel({
  tenantId, initialNombre, initialPlan, initialActivo, initialColor, initialFechaCorte,
}: Props) {
  const router = useRouter()

  const [nombre,     setNombre]     = useState(initialNombre)
  const [plan,       setPlan]       = useState(initialPlan)
  const [activo,     setActivo]     = useState(initialActivo)
  const [color,      setColor]      = useState(initialColor)
  const [fechaCorte, setFechaCorte] = useState(initialFechaCorte)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [msg,        setMsg]        = useState('')
  const [err,        setErr]        = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMsg(''); setErr('')
    const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, plan, activo, colorPrimario: color, fechaCorte }),
    })
    setSaving(false)
    if (res.ok) { setMsg('Guardado.'); router.refresh() }
    else { const d = await res.json(); setErr(d.error ?? 'Error al guardar') }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar el tenant "${nombre}" y todos sus datos? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    const res = await fetch(`/api/superadmin/tenants/${tenantId}`, { method: 'DELETE' })
    if (res.ok) { router.push('/superadmin'); router.refresh() }
    else { const d = await res.json(); setErr(d.error ?? 'Error al eliminar'); setDeleting(false) }
  }

  const inputCls = 'w-full bg-[#0a0a0a] border border-[#1e1e1e] px-3 py-2 text-[12px] font-mono text-[#e8e8e8] focus:outline-none focus:border-[#d4af37] transition-colors'
  const labelCls = 'block text-[10px] font-mono text-[#888] mb-1'

  return (
    <div className="space-y-6">

      {/* Edit form */}
      <form onSubmit={handleSave} className="border border-[#1e1e1e] p-5 space-y-4">
        <div className="text-[9px] font-mono tracking-[2px] uppercase text-[#555] pb-2 border-b border-[#111]">
          Editar Tenant
        </div>

        <div>
          <label className={labelCls}>Nombre</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} required className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Plan</label>
          <select value={plan} onChange={e => setPlan(e.target.value)} className={inputCls}>
            {PLANES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Día de corte mensual (1 – 28)</label>
          <input
            type="number"
            min={1}
            max={28}
            value={fechaCorte}
            onChange={e => setFechaCorte(Math.min(28, Math.max(1, Number(e.target.value))))}
            className={inputCls}
          />
          <p className="text-[9px] font-mono text-[#555] mt-1">
            Próxima renovación: {nextRenewalLabel(fechaCorte)}
          </p>
        </div>

        <div>
          <label className={labelCls}>Color de marca</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="h-8 w-10 bg-transparent border border-[#1e1e1e] cursor-pointer"
            />
            <span className="text-[11px] font-mono text-[#555]">{color}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActivo(v => !v)}
            className={`px-3 py-1 text-[10px] font-mono border transition-colors ${
              activo
                ? 'border-[#27ae60] text-[#27ae60] hover:bg-[rgba(39,174,96,0.08)]'
                : 'border-[#c0392b] text-[#c0392b] hover:bg-[rgba(192,57,43,0.08)]'
            }`}
          >
            {activo ? '● Activo' : '● Inactivo'}
          </button>
          <span className="text-[10px] font-mono text-[#444]">— clic para cambiar</span>
        </div>

        {msg && <p className="text-[11px] font-mono text-[#27ae60]">{msg}</p>}
        {err && <p className="text-[11px] font-mono text-[#c0392b]">{err}</p>}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-[#d4af37] text-[#040404] text-[11px] font-mono font-bold tracking-[1px] uppercase hover:bg-[#c9a227] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>

      {/* Plan badge preview */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-[#555]">Plan actual:</span>
        <span
          className="text-[9px] font-mono px-2 py-0.5"
          style={{
            color:  PLAN_COLOR[plan] ?? '#888',
            border: `1px solid ${PLAN_COLOR[plan] ?? '#333'}`,
          }}
        >
          {plan}
        </span>
      </div>

      {/* Danger zone */}
      <div className="border border-[#c0392b] border-opacity-30 p-4">
        <div className="text-[9px] font-mono tracking-[2px] uppercase text-[#c0392b] mb-3">Zona de Peligro</div>
        <p className="text-[11px] font-mono text-[#555] mb-3">
          Eliminar este tenant borra permanentemente todos sus datos: plazas, titulares, cuentas, abonos y usuarios.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-1.5 border border-[#c0392b] text-[#c0392b] text-[10px] font-mono uppercase tracking-[1px] hover:bg-[rgba(192,57,43,0.12)] disabled:opacity-50 transition-colors"
        >
          {deleting ? 'Eliminando...' : 'Eliminar Tenant'}
        </button>
      </div>

    </div>
  )
}
