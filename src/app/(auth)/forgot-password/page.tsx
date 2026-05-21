'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303] px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="font-serif text-3xl font-bold text-[#d4af37] tracking-widest mb-1">FT</div>
          <div className="text-xs font-mono tracking-[4px] text-[#555] uppercase">Finance Trade</div>
        </div>

        <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-8">
          {sent ? (
            <>
              <div className="text-[10px] font-mono tracking-[2px] text-[#27ae60] uppercase mb-3">
                Instrucciones enviadas
              </div>
              <p className="text-[11px] font-mono text-[#888] leading-relaxed mb-4">
                Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <p className="text-[10px] font-mono text-[#555]">
                Revisa también tu carpeta de spam.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[#e8e8e8] text-lg font-semibold mb-1">Restablecer contraseña</h1>
              <p className="text-[#555] text-xs font-mono tracking-wider mb-8">
                Ingresa tu correo y te enviaremos un enlace
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
                    autoFocus
                    placeholder="usuario@empresa.com"
                    className="w-full bg-[#030303] border border-[#2a2a2a] text-[#e8e8e8] text-sm px-4 py-3 outline-none focus:border-[rgba(212,175,55,0.3)] transition-colors placeholder:text-[#333]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 font-mono text-xs tracking-[3px] uppercase border border-[rgba(212,175,55,0.3)] text-[#d4af37] bg-[rgba(212,175,55,0.06)] hover:bg-[rgba(212,175,55,0.12)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-[10px] font-mono tracking-wider text-[#555] hover:text-[#888] transition-colors"
          >
            ← Volver al inicio de sesión
          </Link>
        </div>

        <p className="text-center text-[9px] font-mono tracking-[2px] text-[#333] mt-4 uppercase">
          End Sierra · Sistema privado
        </p>
      </div>
    </div>
  )
}
