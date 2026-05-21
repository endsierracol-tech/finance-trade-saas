'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, MapPinOff } from 'lucide-react'

const inputCls =
  'w-full bg-[#030303] border border-[#2a2a2a] text-[#e8e8e8] text-xs font-mono px-4 py-2.5 outline-none focus:border-[rgba(212,175,55,0.4)] transition-colors placeholder:text-[#333]'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-2">
        {label}{required && <span className="text-[#d4af37] ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

type CuentaInfo = {
  id: string
  assigned_capital: string | number
  monto_abono: string | number
  remaining_balance: string | number
  plan_abono: string
  estado: string
  cliente: { nombre: string }
}

export default function NuevoAbonoPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const cuentaParam  = searchParams.get('cuenta') ?? ''

  const today = new Date().toISOString().split('T')[0]

  const [cuenta, setCuenta]   = useState<CuentaInfo | null>(null)
  const [monto, setMonto]     = useState('')
  const [fecha, setFecha]     = useState(today)
  const [notas, setNotas]     = useState('')
  const [gps, setGps]         = useState<{ lat: number; lng: number } | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!cuentaParam) return
    fetch(`/api/cuentas/${cuentaParam}`)
      .then(r => r.json())
      .then(d => {
        if (d.cuenta) {
          setCuenta(d.cuenta)
          setMonto(String(Math.round(Number(d.cuenta.monto_abono))))
        }
      })
  }, [cuentaParam])

  function capturarGPS() {
    if (!navigator.geolocation) { setError('GPS no disponible en este dispositivo'); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsLoading(false)
      },
      () => {
        setError('No se pudo obtener ubicación')
        setGpsLoading(false)
      },
      { timeout: 10000 }
    )
  }

  const fmt = (n: number) => n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cuentaParam) { setError('Selecciona una cuenta'); return }
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/abonos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuentaId: cuentaParam,
          monto,
          fecha,
          notas,
          lat: gps?.lat ?? null,
          lng: gps?.lng ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al registrar'); setLoading(false); return }
      router.push(`/cuentas/${cuentaParam}`)
      router.refresh()
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  const backHref = cuentaParam ? `/cuentas/${cuentaParam}` : '/operaciones'

  return (
    <div className="p-6 max-w-lg">

      <div className="mb-6">
        <Link href={backHref} className="flex items-center gap-1.5 text-[10px] font-mono text-[#555] hover:text-[#888] transition-colors mb-4">
          <ArrowLeft size={11} /> Volver
        </Link>
        <h1 className="font-serif text-2xl text-[#e8e8e8]">Registrar Abono</h1>
        <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
          Cobro de cuota
        </p>
      </div>

      {cuenta && (
        <div className="border border-[#1e1e1e] bg-[#0a0a0a] px-5 py-4 mb-5">
          <div className="text-[9px] font-mono text-[#555] uppercase tracking-wider mb-2">Cuenta</div>
          <div className="text-[13px] font-mono text-[#e8e8e8]">{cuenta.cliente.nombre}</div>
          <div className="flex gap-6 mt-2">
            <div>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-wider">Capital</div>
              <div className="text-[11px] font-mono text-[#d4af37]">${fmt(Number(cuenta.assigned_capital))}</div>
            </div>
            <div>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-wider">Cuota {cuenta.plan_abono.toLowerCase()}</div>
              <div className="text-[11px] font-mono text-[#888]">${fmt(Number(cuenta.monto_abono))}</div>
            </div>
            <div>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-wider">Saldo</div>
              <div className="text-[11px] font-mono text-[#e8e8e8]">${fmt(Number(cuenta.remaining_balance))}</div>
            </div>
          </div>
        </div>
      )}

      {!cuentaParam && (
        <div className="border border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.05)] px-4 py-3 mb-5">
          <p className="text-xs font-mono text-[#c0392b]">
            Accede desde una cuenta usando el botón "Registrar abono"
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="border border-[#1e1e1e] bg-[#0d0d0d] p-6 space-y-5">

        <Field label="Monto del abono ($)" required>
          <input
            value={monto}
            onChange={e => setMonto(e.target.value)}
            required
            type="number"
            min="1"
            step="1"
            placeholder="0"
            className={inputCls}
          />
        </Field>

        <Field label="Fecha" required>
          <input
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            required
            type="date"
            className={inputCls}
          />
        </Field>

        <Field label="Notas">
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder="Observaciones opcionales..."
            rows={2}
            className={inputCls + ' resize-none'}
          />
        </Field>

        {/* GPS */}
        <div>
          <div className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mb-2">Ubicación GPS</div>
          {gps ? (
            <div className="flex items-center justify-between border border-[rgba(39,174,96,0.2)] bg-[rgba(39,174,96,0.04)] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <MapPin size={11} className="text-[#27ae60]" />
                <span className="text-[10px] font-mono text-[#27ae60]">
                  {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setGps(null)}
                className="text-[9px] font-mono text-[#555] hover:text-[#888]"
              >
                quitar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={capturarGPS}
              disabled={gpsLoading}
              className="flex items-center gap-2 text-[10px] font-mono text-[#555] hover:text-[#888] border border-[#1e1e1e] px-4 py-2.5 w-full transition-colors disabled:opacity-40"
            >
              {gpsLoading
                ? <><MapPin size={11} className="animate-pulse" /> Obteniendo ubicación...</>
                : <><MapPinOff size={11} /> Capturar ubicación (opcional)</>
              }
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs text-[#c0392b] border border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.05)] px-3 py-2 font-mono">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !cuentaParam}
            className="flex-1 py-2.5 font-mono text-xs tracking-[3px] uppercase border border-[rgba(212,175,55,0.4)] text-[#d4af37] bg-[rgba(212,175,55,0.06)] hover:bg-[rgba(212,175,55,0.12)] transition-colors disabled:opacity-40"
          >
            {loading ? 'Guardando...' : 'Registrar Abono'}
          </button>
          <Link
            href={backHref}
            className="px-6 py-2.5 font-mono text-xs tracking-wider border border-[#1e1e1e] text-[#555] hover:text-[#888] transition-colors"
          >
            Cancelar
          </Link>
        </div>

      </form>
    </div>
  )
}
