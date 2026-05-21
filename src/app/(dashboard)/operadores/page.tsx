import { prisma } from '@/lib/prisma'
import { getSessionCtx } from '@/lib/session-context'
import Link from 'next/link'
import { UserCog, UserPlus } from 'lucide-react'
import { redirect } from 'next/navigation'
import DeleteOperadorButton from './DeleteOperadorButton'
import QuitarGestorButton from './QuitarGestorButton'

const ROL_LABELS: Record<string, string> = {
  PLAZA_ADMIN: 'Admin de Plaza',
  ASESOR:      'Gestor / Asesor',
}

export default async function OperadoresPage() {
  const ctx = await getSessionCtx()
  if (!ctx || ctx.isGestor) redirect('/dashboard')

  const [operadores, plazas] = await Promise.all([
    prisma.usuario.findMany({
      where: {
        tenantId: ctx.tenant.id,
        rol: { in: ['PLAZA_ADMIN', 'ASESOR'] as any },
      },
      include: { plaza: true },
      orderBy: { nombre: 'asc' },
    }),
    prisma.plaza.findMany({
      where: { tenantId: ctx.tenant.id },
      select: {
        id: true, nombre: true, ciudad: true,
        usuarios: {
          where: { activo: true, rol: { in: ['PLAZA_ADMIN', 'ASESOR'] as any } },
          select: { id: true, nombre: true, rol: true },
        },
      },
      orderBy: { nombre: 'asc' },
    }),
  ])

  return (
    <div className="p-6">

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#e8e8e8]">Operadores</h1>
          <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">
            Gestión de accesos y cuentas de operador
          </p>
        </div>
        <Link
          href="/operadores/nuevo"
          className="flex items-center gap-2 px-4 py-2 text-[11px] font-mono tracking-wider border border-[rgba(212,175,55,0.4)] text-[#d4af37] hover:bg-[rgba(212,175,55,0.08)] transition-colors"
        >
          <UserPlus size={13} />
          Nuevo Operador
        </Link>
      </div>

      {/* Alerta si hay plazas sin gestor */}
      {plazas.some(p => p.usuarios.length === 0) && (
        <div className="mb-6 flex items-center gap-3 border border-[rgba(192,57,43,0.35)] bg-[rgba(192,57,43,0.05)] px-4 py-3">
          <span className="text-[#c0392b] text-xs font-mono">!</span>
          <span className="text-[10px] font-mono text-[#c0392b]">
            {plazas.filter(p => p.usuarios.length === 0).map(p => `"${p.nombre}"`).join(', ')}
            {' '}— {plazas.filter(p => p.usuarios.length === 0).length === 1 ? 'plaza sin' : 'plazas sin'} Gestor activo asignado
          </span>
        </div>
      )}

      {operadores.length === 0 ? (
        <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-12 text-center">
          <UserCog size={24} className="mx-auto mb-3 text-[#333]" />
          <div className="text-[#333] text-xs font-mono tracking-wider mb-3">
            No hay operadores registrados
          </div>
          <Link href="/operadores/nuevo" className="text-[#d4af37] text-xs font-mono hover:underline">
            Crear primer operador →
          </Link>
        </div>
      ) : (
        <div className="border border-[#1e1e1e] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
                {['Nombre', 'Email', 'Rol', 'Plaza', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[8px] font-mono tracking-[2px] text-[#555] uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operadores.map((op, i) => (
                <tr key={op.id} className={`border-b border-[#111] hover:bg-[#111] transition-colors ${i % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#0a0a0a]'}`}>
                  <td className="px-4 py-3 text-[12px] text-[#e8e8e8]">{op.nombre}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#888]">{op.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-[9px] font-mono px-2 py-0.5 border border-[rgba(212,175,55,0.3)] text-[#d4af37] bg-[rgba(212,175,55,0.05)]">
                      {ROL_LABELS[op.rol] ?? op.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#555]">
                    {op.plaza?.nombre ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-mono tracking-wider px-2 py-0.5 ${
                      op.activo
                        ? 'text-[#27ae60] bg-[rgba(39,174,96,0.08)] border border-[rgba(39,174,96,0.2)]'
                        : 'text-[#555] bg-[#111] border border-[#1e1e1e]'
                    }`}>
                      {op.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/operadores/${op.id}/editar`}
                        className="text-[10px] font-mono text-[#555] hover:text-[#d4af37] transition-colors"
                      >
                        Editar
                      </Link>
                      <DeleteOperadorButton id={op.id} nombre={op.nombre} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-[#0a0a0a] border-t border-[#111]">
            <span className="text-[9px] font-mono text-[#333]">
              {operadores.length} operador{operadores.length !== 1 ? 'es' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Gestores por Plaza */}
      {plazas.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase">Gestores por Plaza</div>
          </div>
          <div className="border border-[#1e1e1e] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
                  {['Plaza', 'Ciudad', 'Gestor Activo', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[8px] font-mono tracking-[2px] text-[#555] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plazas.map((plaza, i) => (
                  <tr key={plaza.id} className={`border-b border-[#111] ${i % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#0a0a0a]'}`}>
                    <td className="px-4 py-3 text-[12px] text-[#e8e8e8]">{plaza.nombre}</td>
                    <td className="px-4 py-3 text-[11px] font-mono text-[#888]">{plaza.ciudad}</td>
                    <td className="px-4 py-3">
                      {plaza.usuarios.length === 0 ? (
                        <span className="text-[9px] font-mono px-2 py-0.5 text-[#c0392b] bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)]">
                          Sin Gestor
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {plaza.usuarios.map(u => (
                            <span key={u.id} className="text-[11px] font-mono text-[#e8e8e8]">
                              {u.nombre}
                              <span className="text-[9px] text-[#555] ml-2">{ROL_LABELS[u.rol] ?? u.rol}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/operadores/nuevo?plazaId=${plaza.id}`}
                          className="text-[10px] font-mono text-[#555] hover:text-[#d4af37] transition-colors"
                        >
                          {plaza.usuarios.length === 0 ? 'Asignar gestor →' : '+ Agregar otro'}
                        </Link>
                        {plaza.usuarios.map(u => (
                          <QuitarGestorButton
                            key={u.id}
                            id={u.id}
                            nombre={u.nombre}
                            plazaNombre={plaza.nombre}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
