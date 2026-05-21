'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PLAN_LABELS: Record<string, string> = {
  AGIL: 'Ágil',
  PROFESIONAL: 'Profesional',
  ENTERPRISE: 'Enterprise',
}

const inputCls =
  'w-full bg-[#030303] border border-[#2a2a2a] text-[#e8e8e8] text-xs font-mono px-4 py-2.5 outline-none focus:border-[rgba(212,175,55,0.4)] transition-colors'

const inputReadOnlyCls =
  'w-full bg-[#070707] border border-[#1a1a1a] text-[#555] text-xs font-mono px-4 py-2.5 cursor-not-allowed'

export default function NegocioForm({
  nombre,
  plan,
  canEdit,
}: {
  nombre: string
  plan: string
  canEdit: boolean
}) {
  const router    = useRouter()
  const [value, setValue] = useState(nombre)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  async function handleSave() {
    if (!value.trim() || !canEdit) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/configuracion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: value }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); setSaving(false); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    } catch {
      setError('Error de conexión')
    }
    setSaving(false)
  }

  return (
    <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-5 space-y-4">
      <div>
        <label className="block text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-2">
          Nombre del negocio
        </label>
        {canEdit ? (
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            className={inputCls}
          />
        ) : (
          <div className={inputReadOnlyCls}>{nombre}</div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[9px] font-mono text-[#555] uppercase tracking-wider">Plan: </span>
          <span className="text-[10px] font-mono text-[#d4af37]">{PLAN_LABELS[plan] ?? plan}</span>
        </div>
        {canEdit && (
          <div className="flex items-center gap-3">
            {saved  && <span className="text-[10px] font-mono text-[#27ae60]">Guardado</span>}
            {error  && <span className="text-[10px] font-mono text-[#c0392b]">{error}</span>}
            <button
              onClick={handleSave}
              disabled={saving || value === nombre}
              className="text-[10px] font-mono px-4 py-2 border border-[rgba(212,175,55,0.4)] text-[#d4af37] bg-[rgba(212,175,55,0.06)] hover:bg-[rgba(212,175,55,0.12)] transition-colors disabled:opacity-40"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
