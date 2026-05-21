'use client'

import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 text-[10px] font-mono text-[#555] hover:text-[#888] border border-[#1e1e1e] px-3 py-2 transition-colors print:hidden"
    >
      <Printer size={11} />
      Imprimir / PDF
    </button>
  )
}
