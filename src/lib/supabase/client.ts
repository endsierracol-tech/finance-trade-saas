import { createBrowserClient } from '@supabase/ssr'

/**
 * Llamar SOLO dentro de manejadores de evento o de useEffect — nunca durante el
 * render de un componente cliente. Next prerenderiza los componentes cliente
 * para generar el HTML estático, y ahí ejecutaría esta función sin variables de
 * entorno, tumbando la construcción entera.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  // El `!` de TypeScript es una promesa, no una garantía: si falta el .env estas
  // llegan undefined y Supabase tira un error que no dice cuál falta.
  if (!url || !key) {
    const faltan = [
      !url ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
      !key ? 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' : null,
    ].filter(Boolean).join(', ')

    throw new Error(
      `Falta configuración de Supabase: ${faltan}. ` +
      'Copiá .env.example a .env.local y completá los valores desde el vault.'
    )
  }

  return createBrowserClient(url, key)
}
