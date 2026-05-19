import { redirect } from 'next/navigation'

// El middleware redirige a /login si no hay sesión
export default function HomePage() {
  redirect('/dashboard')
}
