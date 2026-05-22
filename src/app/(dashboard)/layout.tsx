import Sidebar from '@/components/layout/Sidebar'
import { getSessionCtx } from '@/lib/session-context'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionCtx()
  const rol = ctx?.usuario?.rol ?? null
  const isGestor = ctx?.isGestor ?? false

  return (
    <div className="flex h-screen bg-[#030303] overflow-hidden">
      <Sidebar rol={rol} isGestor={isGestor} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
