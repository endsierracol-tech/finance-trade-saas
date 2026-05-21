'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function DeleteOperadorButton({ id, nombre }: { id: string; nombre: string }) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`¿Eliminar operador "${nombre}"? Esta acción no se puede deshacer.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/operadores/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error ?? 'Error al eliminar')
      }
    } catch {
      alert('Error de conexión')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1 text-[10px] font-mono text-[#555] hover:text-[#c0392b] transition-colors disabled:opacity-40"
    >
      <Trash2 size={11} />
      {loading ? '...' : 'Eliminar'}
    </button>
  )
}
