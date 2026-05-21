'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ArrowLeftRight,
  FileBarChart,
  Settings,
  LogOut,
  Shield,
  UserCog,
  MapPin,
  CalendarDays,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { label: 'Dashboard',          href: '/dashboard',       icon: LayoutDashboard, section: 'principal' },
  { label: 'Rutas',              href: '/rutas',            icon: MapPin,          section: 'principal' },
  { label: 'Calendario',         href: '/calendario',       icon: CalendarDays,    section: 'principal' },
  { label: 'Titulares',          href: '/titulares',       icon: Users,           section: 'principal' },
  { label: 'Cuentas de Capital', href: '/cuentas',         icon: CreditCard,      section: 'principal' },
  { label: 'Operaciones',        href: '/operaciones',     icon: ArrowLeftRight,  section: 'principal' },
  { label: 'Reportes',           href: '/reportes',        icon: FileBarChart,    section: 'gestion'   },
  { label: 'Operadores',         href: '/operadores',      icon: UserCog,         section: 'gestion'   },
  { label: 'Configuración',      href: '/configuracion',   icon: Settings,        section: 'sistema'   },
]

export default function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sections = ['principal', 'gestion', 'sistema'] as const
  const sectionLabels = { principal: 'Principal', gestion: 'Gestión', sistema: 'Sistema' }

  return (
    <aside className="w-[180px] flex-shrink-0 bg-[#040404] border-r border-[#1e1e1e] flex flex-col h-full">

      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b border-[#1e1e1e]">
        <div className="font-serif text-base font-bold text-[#d4af37] tracking-widest leading-none">FT</div>
        <div className="text-[7.5px] font-mono tracking-[1px] text-[#555] mt-1">Finance Trade</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {sections.map(section => {
          const items = navItems.filter(i => i.section === section)
          if (!items.length) return null
          return (
            <div key={section}>
              <div className="px-4 pt-3 pb-1 text-[7.5px] font-mono tracking-[2px] text-[#555] uppercase">
                {sectionLabels[section]}
              </div>
              {items.map(item => {
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-[11.5px] transition-colors',
                      active
                        ? 'bg-[rgba(212,175,55,0.08)] text-[#d4af37] border-r-2 border-[#d4af37]'
                        : 'text-[#888] hover:text-[#e8e8e8] hover:bg-[#111]'
                    )}
                  >
                    <item.icon size={13} className="flex-shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#1e1e1e] p-2 space-y-1">
        <Link
          href="/superadmin"
          className="flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-[#555] hover:text-[#888] transition-colors"
        >
          <Shield size={11} />
          SuperAdmin
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-[#555] hover:text-[#c0392b] transition-colors"
        >
          <LogOut size={11} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
