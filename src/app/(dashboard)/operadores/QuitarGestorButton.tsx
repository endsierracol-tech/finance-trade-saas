'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function QuitarGestorButton({
  id,
  nombre,
  plazaNombre,
}: {
  id: string
  nombre: string
  plazaNombre: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleQuitar() {
    if (!confirm(`¿Quitar a ${nombre} de la plaza "${plazaNombre}"?\nEl operador seguirá activo pero sin plaza asignada.`)) return
    setLoading(true)
    try {
      await fetch(`/api/operadores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plazaId: null }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleQuitar}
      disabled={loading}
      className="text-[10px] font-mono text-[#555] hover:text-[#c0392b] transition-colors disabled:opacity-40"
    >
      {loading ? 'Quitando...' : 'Quitar'}
    </button>
  )
}
