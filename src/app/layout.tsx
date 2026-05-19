import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Finance Trade',
  description: 'Plataforma de gestión de cuentas de capital',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="h-full bg-[#030303] text-[#e8e8e8] antialiased">
        {children}
      </body>
    </html>
  )
}
