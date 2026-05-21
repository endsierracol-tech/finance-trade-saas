'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

type Plaza = { id: string; nombre: string; ciudad: string }

export default function PlazaFilter({
  plazas,
  selected,
}: {
  plazas: Plaza[]
  selected: string
}) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) params.set('plaza', e.target.value)
    else params.delete('plaza')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select
      value={selected}
      onChange={handleChange}
      className="bg-[#030303] border border-[#2a2a2a] text-[#888] text-[10px] font-mono px-3 py-1.5 outline-none focus:border-[rgba(212,175,55,0.4)] transition-colors appearance-none cursor-pointer"
    >
      <option value="">Todas las plazas</option>
      {plazas.map(p => (
        <option key={p.id} value={p.id}>
          {p.nombre} — {p.ciudad}
        </option>
      ))}
    </select>
  )
}
