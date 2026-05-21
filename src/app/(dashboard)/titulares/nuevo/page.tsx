'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Plaza = { id: string; nombre: string; ciudad: string }

const inputCls =
  'w-full bg-[#030303] border border-[#2a2a2a] text-[#e8e8e8] text-xs font-mono px-4 py-2.5 outline-none focus:border-[rgba(212,175,55,0.4)] transition-colors placeholder:text-[#333]'

const selectCls =
  'w-full bg-[#030303] border border-[#2a2a2a] text-[#e8e8e8] text-xs font-mono px-4 py-2.5 outline-none focus:border-[rgba(212,175,55,0.4)] transition-colors appearance-none'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-2">
        {label}
        {required && <span className="text-[#d4af37] ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function NuevoTitularPage() {
  const router = useRouter()
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [plazas, setPlazas]     = useState<Plaza[]>([])
  const [form, setForm]         = useState({
    nombre: '', identificacion: '', telefono: '',
    direccion: '', referencia1: '', referencia2: '',
    plazaId: '',
  })

  useEffect(() => {
    fetch('/api/plazas')
      .then(r => r.json())
      .then(d => {
        const list: Plaza[] = d.plazas ?? []
        setPlazas(list)
        if (list.length === 1) setForm(p => ({ ...p, plazaId: list[0].id }))
      })
      .catch(() => {/* silencioso — validación en submit */})
  }, [])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.plazaId) { setError('Debes seleccionar una plaza'); return }
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/titulares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al crear titular'); setLoading(false); return }
      router.push('/titulares')
      router.refresh()
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">

      <div className="mb-6">
        <Link
          href="/titulares"
          className="flex items-center gap-1.5 text-[10px] font-mono text-[#555] hover:text-[#888] transition-colors mb-4"
        >
          <ArrowLeft size={11} /> Volver a Titulares
        </Link>
        <h1 className="font-serif text-2xl text-[#e8e8e8]">Nuevo Titular</h1>
        <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
          Registro de titular de cuenta
        </p>
      </div>

      <form onSubmit={handleSubmit} className="border border-[#1e1e1e] bg-[#0d0d0d] p-6 space-y-5">

        <Field label="Plaza" required>
          <select value={form.plazaId} onChange={set('plazaId')} required className={selectCls}>
            <option value="" disabled>Seleccionar plaza...</option>
            {plazas.map(p => (
              <option key={p.id} value={p.id}>{p.nombre} — {p.ciudad}</option>
            ))}
          </select>
          {plazas.length === 0 && (
            <p className="text-[10px] font-mono text-[#555] mt-1">
              No hay plazas registradas.{' '}
              <Link href="/configuracion" className="text-[#d4af37] hover:underline">Crear plaza</Link>
            </p>
          )}
        </Field>

        <Field label="Nombre completo" required>
          <input value={form.nombre} onChange={set('nombre')} required
            placeholder="Juan García López" className={inputCls} />
        </Field>

        <Field label="Número de identificación" required>
          <input value={form.identificacion} onChange={set('identificacion')} required
            placeholder="1234567890" className={inputCls} />
        </Field>

        <Field label="Teléfono" required>
          <input value={form.telefono} onChange={set('telefono')} required
            placeholder="300 000 0000" className={inputCls} />
        </Field>

        <Field label="Dirección" required>
          <input value={form.direccion} onChange={set('direccion')} required
            placeholder="Calle 10 # 20-30, Barrio Centro" className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Referencia 1">
            <input value={form.referencia1} onChange={set('referencia1')}
              placeholder="Nombre y teléfono" className={inputCls} />
          </Field>
          <Field label="Referencia 2">
            <input value={form.referencia2} onChange={set('referencia2')}
              placeholder="Nombre y teléfono" className={inputCls} />
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
            {loading ? 'Guardando...' : 'Registrar Titular'}
          </button>
          <Link
            href="/titulares"
            className="px-6 py-2.5 font-mono text-xs tracking-wider border border-[#1e1e1e] text-[#555] hover:text-[#888] transition-colors"
          >
            Cancelar
          </Link>
        </div>

      </form>
    </div>
  )
}
