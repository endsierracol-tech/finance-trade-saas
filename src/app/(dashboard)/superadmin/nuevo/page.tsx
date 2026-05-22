'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const PLANES = ['AGIL', 'PROFESIONAL', 'ENTERPRISE'] as const

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const inputCls =
  'w-full bg-[#0a0a0a] border border-[#1e1e1e] px-3 py-2 text-[12px] font-mono text-[#e8e8e8] focus:outline-none focus:border-[#d4af37] transition-colors'
const labelCls = 'block text-[10px] font-mono text-[#888] mb-1'
const sectionCls = 'text-[9px] font-mono tracking-[2px] uppercase text-[#555] mb-3 pb-2 border-b border-[#111]'

export default function NuevoTenantPage() {
  const router = useRouter()
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [nombre, setNombre]           = useState('')
  const [slug, setSlug]               = useState('')
  const [plan, setPlan]               = useState<string>('AGIL')
  const [color, setColor]             = useState('#d4af37')
  const [adminNombre, setAdminNombre] = useState('')
  const [adminEmail, setAdminEmail]   = useState('')
  const [adminPass, setAdminPass]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (adminPass.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/superadmin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre, slug, plan,
        colorPrimario: color,
        adminNombre, adminEmail,
        adminPassword: adminPass,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error al crear el tenant'); return }
    router.push('/superadmin')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-xl">
      <Link
        href="/superadmin"
        className="flex items-center gap-1 text-[10px] font-mono text-[#555] hover:text-[#888] mb-6 transition-colors"
      >
        <ChevronLeft size={12} /> Tenants
      </Link>

      <h1 className="font-serif text-xl text-[#e8e8e8] mb-6">Nuevo Tenant</h1>

      <form onSubmit={handleSubmit} className="space-y-7">

        {/* ── Tenant ── */}
        <div>
          <div className={sectionCls}>Datos del Tenant</div>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Nombre *</label>
              <input
                value={nombre}
                onChange={e => { setNombre(e.target.value); setSlug(slugify(e.target.value)) }}
                required
                placeholder="Ej. Finance Trade"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Slug * <span className="text-[#444]">(identificador único)</span></label>
              <input
                value={slug}
                onChange={e => setSlug(slugify(e.target.value))}
                required
                placeholder="finance-trade"
                className={`${inputCls} text-[#555]`}
              />
            </div>
            <div>
              <label className={labelCls}>Plan</label>
              <select
                value={plan}
                onChange={e => setPlan(e.target.value)}
                className={inputCls}
              >
                {PLANES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
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
          </div>
        </div>

        {/* ── Admin ── */}
        <div>
          <div className={sectionCls}>Administrador Principal</div>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Nombre *</label>
              <input
                value={adminNombre}
                onChange={e => setAdminNombre(e.target.value)}
                required
                placeholder="Ej. Freddy Murcia"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                required
                placeholder="admin@empresa.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Contraseña inicial *</label>
              <input
                type="password"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="border border-[#c0392b] bg-[rgba(192,57,43,0.08)] px-3 py-2">
            <p className="text-[11px] font-mono text-[#c0392b]">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-[#d4af37] text-[#040404] text-[11px] font-mono font-bold tracking-[1px] uppercase hover:bg-[#c9a227] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creando tenant...' : 'Crear Tenant'}
        </button>
      </form>
    </div>
  )
}
