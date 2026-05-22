# Finance Trade SaaS — Master Index for LLM Development

> Desarrollado por **END SIERRA** (Nicolas Sierra / `endsierracol@gmail.com`)
> Cliente ancla: **Freddy Murcia** — empresa Finance Trade
> Modelo: SaaS multi-tenant de gestión de microcréditos informales

---

## 1. VOCABULARIO ENMASCARADO (CRÍTICO — nunca usar palabras reales de préstamos)

| Término real        | Vocabulario en UI, DB y código         |
|---------------------|----------------------------------------|
| Préstamo / Crédito  | Cuenta de Capital / Cuenta             |
| Monto prestado      | Capital Asignado / Apertura            |
| Interés / Tasa      | Rendimiento / Margen de Retorno        |
| Cuota / Cobro       | Abono / Aporte / Retorno               |
| Saldo deuda         | Saldo por Cobrar / Balance             |
| Cliente prestatario | Titular / Titular de Cuenta            |
| Cobrador            | Asesor de Cuenta / Operador / Gestor   |
| Sucursal / Ruta     | Plaza / Zona                           |
| Mora / Atraso       | Cuenta en Seguimiento / Cuenta Vencida |

**Aplica en**: UI labels, mensajes de error, nombres de páginas, comentarios de código visibles al usuario. El código interno puede usar nombres técnicos en inglés (`assigned_capital`, `yield_rate`, etc.) pero **nunca** palabras en español que revelen la naturaleza del negocio.

---

## 2. ARQUITECTURA Y STACK

```
Next.js 15 (App Router)  →  Supabase Auth  →  Prisma 7 + PostgreSQL (Supabase)
        ↓                          ↓
   Vercel Deploy            Service Role API
                              (solo server-side)
```

- **Next.js 15 App Router**: server components por defecto, client components solo cuando hay interactividad
- **Prisma 7**: requiere `@prisma/adapter-pg` + `pg`; `datasourceUrl` fue removido; NO usar `engineType="library"`; conexión por `PgAdapter` en `src/lib/prisma.ts`
- **Supabase Auth**: manejo de sesiones en cliente + servidor via cookies (SSR-safe)
- **Supabase Admin API**: crear/eliminar usuarios en `auth.users` — solo desde `src/lib/supabase/admin.ts`, NUNCA exponer la service role key al cliente

### Variables de entorno requeridas (`.env.local` — NUNCA commitear)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # solo server-side, sin prefijo NEXT_PUBLIC_
DATABASE_URL=                     # cadena de conexión Prisma / pg
```

---

## 3. JERARQUÍA DE ROLES

```
SUPERADMIN (endsierracol@gmail.com — END SIERRA)
  └── gestiona tenants y usuarios TENANT_ADMIN
      └── TENANT_ADMIN (ej. Freddy Murcia — cliente SaaS)
            └── gestiona plazas, operadores, cuentas de todo el tenant
                └── PLAZA_ADMIN / ASESOR  (isGestor = true)
                      └── solo ve y opera su plaza asignada (plazaId)
```

### Lógica de acceso por rol (`src/lib/session-context.ts`)

| Rol            | `isGestor` | Acceso a datos          | Módulos bloqueados     |
|----------------|-----------|--------------------------|------------------------|
| SUPERADMIN     | false     | Todo (todos los tenants) | — (futuro M00)         |
| TENANT_ADMIN   | false     | Todo el tenant           | —                      |
| PLAZA_ADMIN    | true      | Solo su plaza (`plazaId`)| Operadores, Plazas crear|
| ASESOR         | true      | Solo su plaza (`plazaId`)| Operadores, Plazas crear|

**Regla de oro**: si `isGestor = true`, el usuario SOLO puede ver y operar registros donde `plazaId === ctx.plazaId`. Esto se aplica en todas las páginas server y todas las rutas API.

---

## 4. ESQUEMA DE BASE DE DATOS (`prisma/schema.prisma`)

```
Tenant (1) ──< Plaza (n) ──< Cliente/Titular (n) ──< Cuenta (n) ──< Abono (n)
Tenant (1) ──< Usuario/Operador (n)
Usuario puede ser asignado a una Plaza (plazaId nullable)
```

### Modelos clave

**Tenant**: `id, nombre, slug, plan(AGIL|PROFESIONAL|ENTERPRISE), activo, colorPrimario`

**Usuario**: `id, tenantId, supabaseId(unique), nombre, email, rol(enum), plazaId(nullable), activo`
- `supabaseId` → enlace con `auth.users` de Supabase
- `plazaId = null` para TENANT_ADMIN y SUPERADMIN

**Plaza**: `id, tenantId, nombre, ciudad, activa`

**Cliente**: `id, tenantId, plazaId, nombre, identificacion, telefono, direccion, lat?, lng?`

**Cuenta**: `id, tenantId, clienteId, operadorId, assigned_capital, yield_rate, total_a_retornar, plan_abono, n_cuotas, monto_abono, remaining_balance, total_abonado, fecha_apertura, fecha_proyectada, fecha_cierre?, estado(ACTIVA|SEGUIMIENTO|CERRADA)`

**Abono**: `id, tenantId, cuentaId, operadorId, monto, fecha, lat?, lng?, notas?`

### Filtros por plaza (helpers en `session-context.ts`)
```typescript
plazaClienteFilter(ctx)   // → { plazaId } — para queries de Cliente
plazaCuentaFilter(ctx)    // → { cliente: { plazaId } } — para queries de Cuenta
plazaAbonoFilter(ctx)     // → { cuenta: { cliente: { plazaId } } } — para queries de Abono
```
Todos retornan `{}` (sin filtro) cuando `ctx.isGestor = false`.

---

## 5. MAPA DE ARCHIVOS

### Librerías core
```
src/lib/
  prisma.ts            — cliente Prisma con globalThis cache (hot reload safe)
  session-context.ts   — getSessionCtx() + helpers de filtro por plaza
  cuenta-utils.ts      — cálculo de cuotas, rendimiento, fechas proyectadas
  utils.ts             — helpers genéricos (cn, formatters, etc.)
  dev-setup.ts         — ⚠ TEMPORAL: auto-crea tenant/usuario en dev; reemplazar con M00
  supabase/
    client.ts          — createBrowserClient (client components)
    server.ts          — createClient con cookies (server components / API routes)
    admin.ts           — createAdminClient con service_role (solo server, para crear/eliminar auth users)
    middleware.ts      — refresh de sesión en middleware.ts
```

### Páginas y rutas API
```
src/app/
  (auth)/
    login/page.tsx     — M01: Login con Supabase (email/password)
  (dashboard)/
    layout.tsx         — Layout con Sidebar + guard de auth
    dashboard/page.tsx — M05: KPIs + tabla por plaza (ADMIN) / vista de plaza (GESTOR)
    titulares/
      page.tsx         — M02: Lista de titulares filtrada por rol
      nuevo/page.tsx   — M02: Formulario nuevo titular (client) — incluye selector de plaza
      [id]/page.tsx    — M02: Detalle del titular + sus cuentas
    cuentas/
      page.tsx         — M03: Lista de cuentas filtrada por rol
      nueva/page.tsx   — M03: Formulario nueva cuenta (client)
      [id]/page.tsx    — M03: Detalle de cuenta + abonos + cierre
    operaciones/
      page.tsx         — M04: Lista de abonos filtrada por rol
      nuevo/page.tsx   — M04: Formulario nuevo abono (client, mobile-first, con GPS)
    reportes/
      page.tsx         — M05: Reporte por titular + por plaza (solo ADMIN)
      PrintButton.tsx  — client component para window.print()
    operadores/
      page.tsx         — M07: Lista de operadores (GESTOR redirige a /dashboard)
      nuevo/page.tsx   — M07: Crear operador (client)
      DeleteOperadorButton.tsx — client component con confirm() antes de DELETE
      [id]/editar/page.tsx     — M07: Editar operador (client)
    configuracion/
      page.tsx         — M06: Configuración (GESTOR: read-only, solo ve su plaza)
      NegocioForm.tsx  — client component (canEdit prop)
      PlazasSection.tsx — client component (readOnly prop)
  api/
    titulares/
      route.ts         — GET (filtrado) + POST (con plazaId obligatorio)
      [id]/route.ts    — GET + PATCH + DELETE de un titular
    cuentas/
      route.ts         — GET (filtrado) + POST
      [id]/route.ts    — GET + PATCH (abono, cierre, edición)
    abonos/
      route.ts         — GET (filtrado) + POST (con GPS opcional)
    plazas/
      route.ts         — GET + POST (solo TENANT_ADMIN)
    operadores/
      route.ts         — GET + POST (crea en Supabase Auth + Prisma)
      [id]/route.ts    — GET + PATCH + DELETE (borra en Auth + Prisma)
    configuracion/
      route.ts         — PATCH nombre del negocio (solo TENANT_ADMIN)
  layout.tsx           — Root layout con fuentes (Playfair Display + Fira Code)
  page.tsx             — Redirect a /dashboard si autenticado, si no a /login

src/components/
  layout/
    Sidebar.tsx        — Navegación lateral; items filtrados por rol
```

---

## 6. DESIGN SYSTEM

> El design system completo (tokens, componentes, patrones, vocabulario) está documentado en:
> **`.interface-design/system.md`** — leer antes de escribir cualquier componente de UI.

Resumen rápido:
```
Superficie base:  #040404 / #0a0a0a / #0d0d0d / #080808
Bordes:           #1e1e1e (primary) / #111 (subtle)
Texto:            #e8e8e8 / #888 / #555 / #333
Acento oro:       #d4af37
Éxito:            #27ae60  |  Alerta: #e67e22  |  Destructivo: #c0392b

Tipografía: font-serif (Playfair Display) para títulos · font-mono (Fira Code) para todo lo demás
Depth: borders-only (cero sombras) · Border radius: 0 (sharp) excepto today indicator
Spacing base: 4px
```

---

## 7. MÓDULOS COMPLETADOS

| ID  | Módulo                                      | Estado |
|-----|---------------------------------------------|--------|
| M01 | Auth (login/logout)                         | ✓      |
| M02 | Titulares + filtro de plaza (ADMIN/GESTOR)  | ✓      |
| M03 | Cuentas de Capital + filtro de plaza        | ✓      |
| M04 | Abonos/Operaciones (GPS) + filtro de plaza  | ✓      |
| M05 | Dashboard KPIs + Reportes PDF + filtro plaza | ✓     |
| M06 | Configuración (negocio, plazas, perfil)     | ✓      |
| M07 | Gestión de Operadores (CRUD + Supabase Auth) | ✓     |
| M08 | Calendario de cobros (mes, panel lateral, plaza filter) | ✓ |
| M09 | Rutas + filtro de plaza                     | ✓      |
| M00 | SuperAdmin (gestión tenants + TENANT_ADMIN, role-gating sidebar) | ✓ |

**Aislamiento multi-plaza**: aplicado uniformemente en todos los módulos via `getSessionCtx()` + helpers de filtro.

### Archivos M00
```
src/app/(dashboard)/superadmin/
  page.tsx              — lista de tenants con stats
  nuevo/page.tsx        — crear tenant + TENANT_ADMIN
  [id]/page.tsx         — detalle: stats + lista usuarios
  [id]/TenantEditPanel.tsx — edit inline (nombre, plan, color, activo/inactivo, eliminar)
src/app/api/superadmin/
  tenants/route.ts      — GET list + POST create
  tenants/[id]/route.ts — GET + PATCH + DELETE (borra Auth + Prisma)
```

**Nota**: `session-context.ts` fue corregido — ahora busca usuario por `supabaseId` primero, luego su tenant por `tenantId` (fix multi-tenant real). `dev-setup.ts` detecta `endsierracol@gmail.com` y asigna rol SUPERADMIN en nuevas instalaciones.

---

## 8. PENDIENTES (por prioridad)

### Alta prioridad
1. ~~**Página "Olvidé mi contraseña"**~~ ✓ Completado
2. ~~**M00 SuperAdmin**~~ ✓ Completado

### Media prioridad
3. **Deploy a Vercel**: configurar env vars en Vercel dashboard + dominio personalizado (aplazado — liberación de correo pendiente)
4. **Supabase RLS policies**: segunda capa de seguridad multi-tenant a nivel DB

### Baja prioridad
5. **Módulo Seguimiento**: cuentas vencidas, alertas, notificaciones
6. **Portal Titular**: consulta de saldos para el cliente final (rol TITULAR)
7. **Audit Log**: tabla `AuditLog` ya existe en schema pero sin uso aún

---

## 9. REGLAS DE DESARROLLO

1. **Seguridad**: `SUPABASE_SERVICE_ROLE_KEY` solo en server; NUNCA prefijo `NEXT_PUBLIC_`. `.env.local` NUNCA se commitea.
2. **Filtrado**: toda query de Prisma en páginas y API routes DEBE pasar por `getSessionCtx()` y aplicar los helpers de filtro. No hay excepción.
3. **Roles en API**: verificar `ctx.isGestor` antes de operaciones de escritura en plazas/operadores. Retornar 403 si no autorizado.
4. **Prisma 7**: si se agrega un nuevo modelo, recordar aplicar `tenantId` y el filtro correspondiente en `session-context.ts`.
5. **Mobile-first**: M03 (Cuentas) y M04 (Abonos/Operaciones) deben ser usables desde celular — los operadores cobran en campo.
6. **Vocabulario**: revisar este INDEX sección 1 antes de escribir cualquier texto visible al usuario.
7. **No comentarios innecesarios**: solo comentar el WHY cuando no es obvio. Sin docstrings multi-línea.

---

## 10. FLUJO DE DATOS TÍPICO (referencia)

```
Usuario inicia sesión (Supabase Auth)
  → middleware.ts refresca cookies
  → layout.tsx verifica auth, redirige si no está logueado
  → getSessionCtx() resuelve: tenant + usuario + isGestor + plazaId
  → page.tsx aplica filtros Prisma según rol
  → API routes validan ctx antes de leer/escribir
```

---

*Última actualización: 2026-05-21 — END SIERRA*
