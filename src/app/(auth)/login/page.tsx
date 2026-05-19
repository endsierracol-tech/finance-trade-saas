'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales inválidas. Verifica tu correo y contraseña.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303] px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="font-serif text-3xl font-bold text-[#d4af37] tracking-widest mb-1">
            FT
          </div>
          <div className="text-xs font-mono tracking-[4px] text-[#555] uppercase">
            Finance Trade
          </div>
        </div>

        {/* Card */}
        <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-8">
          <h1 className="text-[#e8e8e8] text-lg font-semibold mb-1">Acceso al sistema</h1>
          <p className="text-[#555] text-xs font-mono tracking-wider mb-8">
            PLATAFORMA PRIVADA · ACCESO RESTRINGIDO
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-[#030303] border border-[#2a2a2a] text-[#e8e8e8] text-sm px-4 py-3 outline-none focus:border-[rgba(212,175,55,0.4)] transition-colors placeholder:text-[#333]"
                placeholder="usuario@empresa.com"
              />
            </div>

            <div>
              <label className="block text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-[#030303] border border-[#2a2a2a] text-[#e8e8e8] text-sm px-4 py-3 outline-none focus:border-[rgba(212,175,55,0.4)] transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-[#c0392b] border border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.05)] px-3 py-2 font-mono">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-mono text-xs tracking-[3px] uppercase border border-[rgba(212,175,55,0.3)] text-[#d4af37] bg-[rgba(212,175,55,0.06)] hover:bg-[rgba(212,175,55,0.12)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/forgot-password"
              className="text-[10px] font-mono tracking-wider text-[#555] hover:text-[#888] transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        <p className="text-center text-[9px] font-mono tracking-[2px] text-[#333] mt-6 uppercase">
          End Sierra · Sistema privado
        </p>
      </div>
    </div>
  )
}
