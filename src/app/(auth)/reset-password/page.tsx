'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
      return
    }

    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2000)
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
          {done ? (
            <>
              <div className="text-[10px] font-mono tracking-[2px] text-[#27ae60] uppercase mb-3">
                Contraseña actualizada
              </div>
              <p className="text-[11px] font-mono text-[#888]">
                Redirigiendo al sistema...
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[#e8e8e8] text-lg font-semibold mb-1">Nueva contraseña</h1>
              <p className="text-[#555] text-xs font-mono tracking-wider mb-8">
                Elige una contraseña de al menos 8 caracteres
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-2">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoFocus
                    className="w-full bg-[#030303] border border-[#2a2a2a] text-[#e8e8e8] text-sm px-4 py-3 outline-none focus:border-[rgba(212,175,55,0.3)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-2">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    className="w-full bg-[#030303] border border-[#2a2a2a] text-[#e8e8e8] text-sm px-4 py-3 outline-none focus:border-[rgba(212,175,55,0.3)] transition-colors"
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
                  {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-[9px] font-mono tracking-[2px] text-[#333] mt-6 uppercase">
          End Sierra · Sistema privado
        </p>
      </div>
    </div>
  )
}
