'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Plaza = { id: string; nombre: string; ciudad: string }

const inputCls =
  'w-full bg-[#030303] border border-[#2a2a2a] text-[#e8e8e8] text-xs font-mono px-4 py-2.5 outline-none focus:border-[rgba(212,175,55,0.4)] transition-colors placeholder:text-[#333]'

const selectCls =
  'w-full bg-[#030303] border border-[#2a2a2a] text-[#e8e8e8] text-xs font-mono px-4 py-2.5 outline-none focus:border-[rgba(212,175,55,0.4)] transition-colors appearance-none'

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

export default function NuevoOperadorPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const preselPlaza  = searchParams.get('plazaId') ?? ''

  const [plazas, setPlazas]   = useState<Plaza[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({
    nombre: '', email: '', password: '', rol: 'ASESOR', plazaId: preselPlaza,
  })

  useEffect(() => {
    fetch('/api/plazas')
      .then(r => r.json())
      .then(d => {
        const list: Plaza[] = d.plazas ?? []
        setPlazas(list)
        // Auto-selecciona solo si no llegó un plazaId por URL y hay exactamente 1 plaza
        if (list.length === 1 && !preselPlaza) setForm(p => ({ ...p, plazaId: list[0].id }))
      })
  }, [preselPlaza])

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.plazaId) { setError('Selecciona una plaza'); return }
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/operadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al crear operador'); setLoading(false); return }
      router.push('/operadores')
      router.refresh()
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg">

      <div className="mb-6">
        <Link href="/operadores" className="flex items-center gap-1.5 text-[10px] font-mono text-[#555] hover:text-[#888] transition-colors mb-4">
          <ArrowLeft size={11} /> Volver a Operadores
        </Link>
        <h1 className="font-serif text-2xl text-[#e8e8e8]">Nuevo Operador</h1>
        <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
          Crear cuenta de acceso al sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="border border-[#1e1e1e] bg-[#0d0d0d] p-6 space-y-5">

        <Field label="Nombre completo" required>
          <input value={form.nombre} onChange={set('nombre')} required
            placeholder="Ana Martínez" className={inputCls} />
        </Field>

        <Field label="Correo electrónico" required>
          <input value={form.email} onChange={set('email')} type="email" required
            placeholder="ana@empresa.com" className={inputCls} />
        </Field>

        <Field label="Contraseña" required>
          <input value={form.password} onChange={set('password')} type="password" required
            placeholder="Mínimo 8 caracteres" className={inputCls} />
          <p className="text-[9px] font-mono text-[#333] mt-1">El operador usará esta contraseña para ingresar.</p>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Rol" required>
            <select value={form.rol} onChange={set('rol')} className={selectCls}>
              <option value="ASESOR">Gestor / Asesor</option>
              <option value="PLAZA_ADMIN">Admin de Plaza</option>
            </select>
          </Field>

          <Field label="Plaza" required>
            <select value={form.plazaId} onChange={set('plazaId')} required className={selectCls}>
              <option value="" disabled>Seleccionar...</option>
              {plazas.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </Field>
        </div>

        {error && (
          <p className="text-xs text-[#c0392b] border border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.05)] px-3 py-2 font-mono">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit" disabled={loading}
            className="flex-1 py-2.5 font-mono text-xs tracking-[3px] uppercase border border-[rgba(212,175,55,0.4)] text-[#d4af37] bg-[rgba(212,175,55,0.06)] hover:bg-[rgba(212,175,55,0.12)] transition-colors disabled:opacity-40"
          >
            {loading ? 'Creando...' : 'Crear Operador'}
          </button>
          <Link href="/operadores" className="px-6 py-2.5 font-mono text-xs tracking-wider border border-[#1e1e1e] text-[#555] hover:text-[#888] transition-colors">
            Cancelar
          </Link>
        </div>

      </form>
    </div>
  )
}
