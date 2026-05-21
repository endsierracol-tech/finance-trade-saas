'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Plaza = { id: string; nombre: string; ciudad: string }

const inputCls =
  'w-full bg-[#030303] border border-[#2a2a2a] text-[#e8e8e8] text-xs font-mono px-4 py-2.5 outline-none focus:border-[rgba(212,175,55,0.4)] transition-colors placeholder:text-[#333]'

const selectCls =
  'w-full bg-[#030303] border border-[#2a2a2a] text-[#e8e8e8] text-xs font-mono px-4 py-2.5 outline-none focus:border-[rgba(212,175,55,0.4)] transition-colors appearance-none'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-2">{label}</label>
      {children}
    </div>
  )
}

export default function EditarOperadorPage() {
  const router   = useRouter()
  const { id }   = useParams<{ id: string }>()
  const [plazas, setPlazas]   = useState<Plaza[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [saved,  setSaved]    = useState(false)
  const [error,  setError]    = useState('')
  const [form, setForm]       = useState({
    nombre: '', rol: 'ASESOR', plazaId: '', activo: true,
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/plazas').then(r => r.json()),
      fetch(`/api/operadores/${id}`).then(r => r.json()),
    ]).then(([plazaData, opData]) => {
      setPlazas(plazaData.plazas ?? [])
      if (opData.operador) {
        const op = opData.operador
        setForm({ nombre: op.nombre, rol: op.rol, plazaId: op.plazaId ?? '', activo: op.activo })
      }
      setFetching(false)
    }).catch(() => setFetching(false))
  }, [id])

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch(`/api/operadores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); setLoading(false); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    } catch {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  if (fetching) {
    return <div className="p-6 text-[#555] font-mono text-xs">Cargando...</div>
  }

  return (
    <div className="p-6 max-w-lg">

      <div className="mb-6">
        <Link href="/operadores" className="flex items-center gap-1.5 text-[10px] font-mono text-[#555] hover:text-[#888] transition-colors mb-4">
          <ArrowLeft size={11} /> Volver a Operadores
        </Link>
        <h1 className="font-serif text-2xl text-[#e8e8e8]">Editar Operador</h1>
        <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
          Modificar datos y accesos
        </p>
      </div>

      <form onSubmit={handleSave} className="border border-[#1e1e1e] bg-[#0d0d0d] p-6 space-y-5">

        <Field label="Nombre completo">
          <input value={form.nombre} onChange={set('nombre')} required className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Rol">
            <select value={form.rol} onChange={set('rol')} className={selectCls}>
              <option value="ASESOR">Gestor / Asesor</option>
              <option value="PLAZA_ADMIN">Admin de Plaza</option>
            </select>
          </Field>

          <Field label="Plaza">
            <select value={form.plazaId} onChange={set('plazaId')} className={selectCls}>
              <option value="" disabled>Seleccionar...</option>
              {plazas.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="activo"
            checked={form.activo}
            onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))}
            className="accent-[#d4af37] w-3.5 h-3.5"
          />
          <label htmlFor="activo" className="text-[11px] font-mono text-[#888] cursor-pointer">
            Cuenta activa (puede iniciar sesión)
          </label>
        </div>

        <div className="border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2.5">
          <p className="text-[9px] font-mono text-[#555]">
            Para cambiar la contraseña, el operador debe usar "Olvidé mi contraseña" en el login.
          </p>
        </div>

        {error  && <p className="text-xs text-[#c0392b] border border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.05)] px-3 py-2 font-mono">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit" disabled={loading}
            className="flex-1 py-2.5 font-mono text-xs tracking-[3px] uppercase border border-[rgba(212,175,55,0.4)] text-[#d4af37] bg-[rgba(212,175,55,0.06)] hover:bg-[rgba(212,175,55,0.12)] transition-colors disabled:opacity-40"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          {saved && <span className="text-[10px] font-mono text-[#27ae60]">Guardado</span>}
          <Link href="/operadores" className="px-5 py-2.5 font-mono text-xs border border-[#1e1e1e] text-[#555] hover:text-[#888] transition-colors">
            Cancelar
          </Link>
        </div>

      </form>
    </div>
  )
}
