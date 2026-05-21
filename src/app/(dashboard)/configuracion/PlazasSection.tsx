'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

type Plaza = { id: string; nombre: string; ciudad: string }

const inputCls =
  'bg-[#030303] border border-[#2a2a2a] text-[#e8e8e8] text-xs font-mono px-3 py-2 outline-none focus:border-[rgba(212,175,55,0.4)] transition-colors placeholder:text-[#333]'

export default function PlazasSection({
  initialPlazas,
  readOnly,
}: {
  initialPlazas: Plaza[]
  readOnly: boolean
}) {
  const router    = useRouter()
  const [plazas, setPlazas] = useState<Plaza[]>(initialPlazas)
  const [open,   setOpen]   = useState(false)
  const [nombre, setNombre] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  async function handleCreate() {
    if (!nombre.trim() || !ciudad.trim()) { setError('Nombre y ciudad son requeridos'); return }
    setSaving(true)
    setError('')
    try {
      const res  = await fetch('/api/plazas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, ciudad }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); setSaving(false); return }
      setPlazas(p => [...p, data.plaza])
      setNombre('')
      setCiudad('')
      setOpen(false)
      router.refresh()
    } catch {
      setError('Error de conexión')
    }
    setSaving(false)
  }

  return (
    <div className="border border-[#1e1e1e] bg-[#0d0d0d] overflow-hidden">
      {plazas.length === 0 && !open ? (
        <div className="p-6 text-center text-[#333] text-xs font-mono">Sin plazas registradas</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
              {['Nombre', 'Ciudad'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[8px] font-mono tracking-[2px] text-[#555] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plazas.map((p, i) => (
              <tr key={p.id} className={`border-b border-[#111] ${i % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#0a0a0a]'}`}>
                <td className="px-4 py-3 text-[12px] text-[#e8e8e8]">{p.nombre}</td>
                <td className="px-4 py-3 text-[11px] font-mono text-[#888]">{p.ciudad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Formulario inline — solo ADMIN */}
      {!readOnly && open && (
        <div className="border-t border-[#1e1e1e] p-4 bg-[#0a0a0a] space-y-3">
          <div className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase">Nueva plaza</div>
          <div className="flex gap-3">
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre de la plaza"
              className={inputCls + ' flex-1'}
            />
            <input
              value={ciudad}
              onChange={e => setCiudad(e.target.value)}
              placeholder="Ciudad"
              className={inputCls + ' flex-1'}
            />
          </div>
          {error && <p className="text-[10px] font-mono text-[#c0392b]">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="text-[10px] font-mono px-4 py-1.5 border border-[rgba(212,175,55,0.4)] text-[#d4af37] bg-[rgba(212,175,55,0.06)] hover:bg-[rgba(212,175,55,0.12)] transition-colors disabled:opacity-40"
            >
              {saving ? 'Creando...' : 'Crear'}
            </button>
            <button
              onClick={() => { setOpen(false); setError(''); setNombre(''); setCiudad('') }}
              className="text-[10px] font-mono px-4 py-1.5 border border-[#1e1e1e] text-[#555] hover:text-[#888] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Botón añadir — solo ADMIN */}
      {!readOnly && !open && (
        <div className="border-t border-[#1e1e1e] bg-[#0a0a0a]">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-4 py-3 text-[10px] font-mono text-[#555] hover:text-[#d4af37] transition-colors w-full"
          >
            <Plus size={11} /> Nueva plaza
          </button>
        </div>
      )}
    </div>
  )
}
