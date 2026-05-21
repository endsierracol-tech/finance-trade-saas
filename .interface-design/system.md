# Finance Trade — Interface Design System

## Product Context

**Who is this human?**
Two personas: (1) ADMIN — an operations owner reviewing multi-city collection performance from a desk, checking totals and drilling into plaza breakdowns mid-morning. (2) GESTOR — a field collection operator, checking daily routes and logging payments, often on a laptop, fast and task-focused.

**What must they accomplish?**
ADMIN: Monitor capital at risk, collection performance per plaza, and operator coverage. GESTOR: See what to collect today, register payments, track overdue accounts.

**What should this feel like?**
Cold like a trading terminal. Dense like a Bloomberg screen. Precise like a ledger. Not friendly, not approachable — authoritative and data-forward. Every pixel earns its place.

---

## Direction

**Domain:** Financial operations floor — ledger entries, clearinghouses, account reconciliation, collection routes, position management.

**Color world:** The world is near-black with gold ledger ink. The physical analogue is a vault room at night — dark steel surfaces, gold-leafed entries, red ink for deficits, green ink for receipts.

**Signature:** Micro-typography at 7.5px–12px with wide letter-spacing (`tracking-[2px]`) for all labels and metadata. Everything reads like a financial report, not a consumer app.

**Defaults rejected:**
- ~~White/light card backgrounds~~ → near-black surfaces (`#0a0a0a`)
- ~~Rounded corners~~ → zero radius, sharp edges throughout
- ~~Color headers and icons~~ → muted `#555` labels, color only for semantic meaning

---

## Token Reference

### Surfaces (elevation stack)
```
Base canvas:         #040404  (sidebar, page root)
Level 1 — cards:    #0a0a0a  (panels, table headers, KPI cards)
Level 2 — rows alt: #0d0d0d  (alternating table rows, empty states)
Level 3 — inset:    #080808  (panel footers, footer totals)
Hover state:        #0f0f0f  (calendar cell hover)
Active row:         #111111  (table row hover, active nav item bg)
```

### Borders
```
Primary:    border-[#1e1e1e]             — main structural borders
Subtle:     border-[#111]               — row separators inside tables
Brand soft: border-[rgba(212,175,55,0.3)] — on brand-hover elements
Brand dim:  border-[rgba(212,175,55,0.2)] — status badges (success context)
Alert:      border-[rgba(192,57,43,0.35)] — alert banners border
Alert dim:  border-[rgba(192,57,43,0.2)]  — pending badges
Watch dim:  border-[rgba(230,126,34,0.2)] — seguimiento badges
```

### Text hierarchy
```
Primary:   text-[#e8e8e8]  — main content, names, values
Secondary: text-[#888]     — supporting data, metadata
Tertiary:  text-[#555]     — labels, section headers, muted info
Muted:     text-[#444]     — calendar day headers, dim labels
Ghost:     text-[#333]     — placeholders, count footers, disabled
```

### Brand & Semantic colors
```
Brand gold:   #d4af37   — accent, active nav, KPI values, CTA hover
Success:      #27ae60   — cobrado, activo, total abonado
Warning:      #e67e22   — seguimiento (watch) status
Destructive:  #c0392b   — pendiente, alerts, sin gestor, CERRADA danger
```

### Semantic badge pattern
```tsx
// Cobrado / Activo / Success
"text-[#27ae60] bg-[rgba(39,174,96,0.08)] border border-[rgba(39,174,96,0.2)]"

// Pendiente / Alert / Destructive
"text-[#c0392b] bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)]"

// Seguimiento / Warning
"text-[#e67e22] border-[rgba(230,126,34,0.2)] bg-[rgba(230,126,34,0.06)]"

// Inactivo / Closed / Muted
"text-[#555] border-[#1e1e1e] bg-[#111]"

// Brand CTA border button
"border border-[rgba(212,175,55,0.4)] text-[#d4af37] hover:bg-[rgba(212,175,55,0.08)]"
```

---

## Typography

**Depth strategy:** Borders-only. Zero shadows anywhere. Dark surfaces use border separation exclusively.

**Border radius:** 0 (none) throughout. Exception: `rounded-full` only for today indicator circle in calendar.

**Base spacing unit:** 4px. Scale: 0.5 (2px), 1 (4px), 1.5 (6px), 2 (8px), 3 (12px), 4 (16px), 6 (24px).

### Type scale
```
Page title:      font-serif text-2xl text-[#e8e8e8]
Section label:   text-[7.5px] font-mono tracking-[1.5px] text-[#555] uppercase
Table header:    text-[8px] font-mono tracking-[2px] text-[#555] uppercase
Nav subtitle:    text-[7.5px] font-mono tracking-[1px] text-[#555]
Badge/status:    text-[9px] font-mono tracking-wider px-2 py-0.5 border
Body data:       text-[11px] font-mono text-[#888]
Primary name:    text-[12px] text-[#e8e8e8]
KPI value:       text-2xl font-mono (or text-xl) leading-none
Nav item:        text-[11.5px]
Count footer:    text-[9px] font-mono text-[#333]
Micro label:     text-[7.5px] font-mono (calendar badges, mini status)
```

### Wordmark
```tsx
<div className="font-serif text-base font-bold text-[#d4af37] tracking-widest leading-none">FT</div>
<div className="text-[7.5px] font-mono tracking-[1px] text-[#555] mt-1">Finance Trade</div>
```

---

## Component Patterns

### Page header (standard)
```tsx
<div className="flex items-start justify-between mb-6">
  <div>
    <h1 className="font-serif text-2xl text-[#e8e8e8]">{Title}</h1>
    <p className="text-[9px] font-mono tracking-[2px] text-[#555] uppercase mt-1">{subtitle}</p>
  </div>
  {/* Filter / CTA on right */}
</div>
```

### Data table (standard)
```tsx
<div className="border border-[#1e1e1e] overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
        <th className="px-4 py-3 text-left text-[8px] font-mono tracking-[2px] text-[#555] uppercase">{Header}</th>
      </tr>
    </thead>
    <tbody>
      <tr className={`border-b border-[#111] hover:bg-[#111] transition-colors ${i % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#0a0a0a]'}`}>
        {/* cells */}
      </tr>
    </tbody>
  </table>
  <div className="px-4 py-2 bg-[#0a0a0a] border-t border-[#111]">
    <span className="text-[9px] font-mono text-[#333]">{N} registros</span>
  </div>
</div>
```

### KPI card
```tsx
<div className="bg-[#0a0a0a] border border-[#1e1e1e] p-4">
  <div className="text-[7.5px] font-mono tracking-[1.5px] text-[#555] uppercase mb-2">{Label}</div>
  <div className="text-2xl font-mono leading-none text-[#d4af37]">{Value}</div>
</div>
```

### Empty state
```tsx
<div className="border border-[#1e1e1e] bg-[#0d0d0d] p-12 text-center">
  <div className="text-[#333] text-xs font-mono tracking-wider mb-3">{Message}</div>
  <Link href="..." className="text-[#d4af37] text-xs font-mono hover:underline">CTA →</Link>
</div>
```

### Alert banner (destructive)
```tsx
<div className="flex items-center justify-between border border-[rgba(192,57,43,0.35)] bg-[rgba(192,57,43,0.05)] px-4 py-3">
  <div className="flex items-center gap-3">
    <span className="text-[#c0392b] text-xs font-mono">!</span>
    <span className="text-[10px] font-mono text-[#c0392b]">{Message}</span>
  </div>
  <Link href="..." className="text-[9px] font-mono tracking-[1.5px] uppercase text-[#c0392b] hover:text-[#e8e8e8] transition-colors">
    Acción →
  </Link>
</div>
```

### Form input
```tsx
<input className="w-full bg-[#0a0a0a] border border-[#1e1e1e] text-[#e8e8e8] text-xs font-mono px-3 py-2 outline-none focus:border-[rgba(212,175,55,0.3)] transition-colors placeholder:text-[#333]" />
```

### CTA link (brand bordered)
```tsx
<Link className="flex items-center gap-2 px-4 py-2 text-[11px] font-mono tracking-wider border border-[rgba(212,175,55,0.4)] text-[#d4af37] hover:bg-[rgba(212,175,55,0.08)] transition-colors">
  <Icon size={13} />
  Label
</Link>
```

### "Ver →" row link
```tsx
<Link className="text-[10px] font-mono text-[#555] hover:text-[#d4af37] transition-colors">
  Ver →
</Link>
```

---

## Sidebar

- Width: `w-[180px]`, background `bg-[#040404]`, border-right `border-[#1e1e1e]`
- Active item: `bg-[rgba(212,175,55,0.08)] text-[#d4af37] border-r-2 border-[#d4af37]`
- Inactive item: `text-[#888] hover:text-[#e8e8e8] hover:bg-[#111]`
- Section labels: `text-[7.5px] font-mono tracking-[2px] text-[#555] uppercase`
- Icon size: 13px throughout nav, 11px in footer

---

## Vocabulary Constraints (CRITICAL)

NEVER use in UI, code, or database: "préstamo", "crédito", "interés", "deudor", "mora", "cobrador"

Use instead:
- "Capital" (not loan/credit)
- "Titular" (not debtor)
- "Abono" / "Cuota" (not payment on debt)
- "Cuenta de Capital" (not loan account)
- "Gestor" (not collector)
- "Plaza" (territory/zone)
- "Seguimiento" (watch status, not overdue)

---

## Iconography

- Icon library: `lucide-react` exclusively
- Standard size: 13px for nav/body icons, 11px for footer/utility icons
- Icons used: `LayoutDashboard`, `Users`, `CreditCard`, `ArrowLeftRight`, `FileBarChart`, `Settings`, `LogOut`, `Shield`, `UserCog`, `MapPin`, `CalendarDays`, `ChevronLeft`, `ChevronRight`, `X`, `UserPlus`, `Search`

---

## Interaction States

- Hover: `hover:bg-[#111]` (rows), `hover:text-[#e8e8e8]` (nav/links), `hover:text-[#d4af37]` (action links)
- Focus input: `focus:border-[rgba(212,175,55,0.3)]`
- Active nav: gold right-border + gold text + faint gold bg
- Transition: `transition-colors` on all interactive elements (no duration override)
- Today indicator: `inline-flex items-center justify-center w-5 h-5 bg-[#d4af37] text-[#000] text-[9px] font-mono rounded-full`

---

## Number Formatting

All monetary values: `n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })`
Displayed as: `$${fmt(n)}` — no decimals, Colombian locale separators.
