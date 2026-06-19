# 12 — Style Guide (Brand & Theme)

The visual language for *Sistem Perpustakaan Sekolah*. It shares the brand with the
companion *Sistem Perizinan Santri* — both are systems for the same school — so a
reviewer sees one consistent identity across the two-project submission. Colors are
taken from the school's public site,
**[insantama.sch.id](https://insantama.sch.id/)** (SIT Insantama), whose design
system (Bricks + Automatic.css) exposes the brand as CSS variables. This doc is the
**single source of truth** for color: the brand tokens live once in Tailwind's
`@theme` (`apps/frontend/src/index.css`) and are bridged into a minimal Mantine
theme so component internals match. Components reference **Tailwind tokens**
(`bg-brand-600`, `text-navy-800`) — never re-pick hex by eye.

> Ties to [06-frontend.md](./06-frontend.md) ("Mantine for behavior, Tailwind for
> styling") and to the status **badge tones** in
> [03-business-rules.md](./03-business-rules.md).

## Brand palette

Lifted from the live Automatic.css variables (`--primary`, `--base`, plus the Bricks
nav accent). Three roles:

| Role | Use | Hex |
|------|-----|-----|
| **Primary — Maroon** | Primary actions, active nav, links, brand chrome | `#781118` |
| **Base — Navy** | Headings, body text, sidebar/AppShell surfaces | `#0a2434` |
| **Accent — Gold** | Sparingly: hover highlights, dividers, emphasis on dark | `#d6b732` |
| White | Page background, text on dark/maroon | `#ffffff` |

### Maroon ramp (primary)
| Step | Hex | Note |
|------|-----|------|
| ultra-light | `#fce9ea` | tints, hovered table rows |
| light | `#f5bcc0` | soft fills |
| dark | `#701016` | pressed/active |
| hover | `#8a141c` | button hover |
| ultra-dark | `#2d0609` | text on light maroon |

### Navy ramp (base)
| Step | Hex | Note |
|------|-----|------|
| ultra-light | `#eaf4fb` | app background blocks |
| light | `#bfdff3` | borders, dividers |
| semi-dark | `#1d6796` | secondary accents |
| dark | `#144a6b` | header background option |
| base | `#0a2434` | primary text color |

## Accessibility (must hold)

- **Maroon `#781118` on white** ≈ 9.6:1 contrast → safe for body text, buttons, links.
- **Navy `#0a2434` on white** ≈ 16:1 → the default text color.
- **Gold `#d6b732` on white** ≈ 1.9:1 → **fails** for text. Use gold only as a large
  decorative accent, a border, or as foreground **on dark navy/maroon** — never as
  text on a light background.

## Integration: Mantine + Tailwind via CSS cascade layers

**This is the load-bearing detail of the whole setup.** Mantine ships its component
CSS inside a `@layer mantine`; Tailwind v4 emits `theme`/`base`/`components`/
`utilities` layers. Browsers apply later-declared layers at higher priority, so we
declare `mantine` **first** — then a `className="bg-brand-600"` reliably overrides
Mantine's default background. Get the order wrong and Tailwind utilities silently
lose to Mantine.

```css
/* apps/frontend/src/index.css — the single CSS entry, imported in main.tsx */

/* 1) Declare the order up front: mantine has LOWEST priority. */
@layer mantine, theme, base, components, utilities;

/* 2) Import Mantine's *layered* stylesheets (note `.layer.css`) into @layer mantine. */
@import '@mantine/core/styles.layer.css';
@import '@mantine/dates/styles.layer.css';
@import '@mantine/notifications/styles.layer.css';

/* 3) Tailwind 4 — its layers were named above, so utilities sort AFTER mantine. */
@import 'tailwindcss';

/* 4) Brand tokens → Tailwind utilities (bg-brand-600, text-navy-800, border-gold-400…). */
@theme {
  --color-brand-50:  #fce9ea; --color-brand-100: #f5bcc0; --color-brand-200: #ec9aa1;
  --color-brand-300: #e0727b; --color-brand-400: #d24e58; --color-brand-500: #a82832;
  --color-brand-600: #781118; /* canonical maroon */
  --color-brand-700: #701016; --color-brand-800: #560c11; --color-brand-900: #2d0609;

  --color-navy-50:  #eaf4fb; --color-navy-100: #d4e8f6; --color-navy-200: #bfdff3;
  --color-navy-300: #95cbed; --color-navy-400: #69b4e2; --color-navy-500: #3f8fc0;
  --color-navy-600: #1d6796; --color-navy-700: #144a6b;
  --color-navy-800: #0a2434; /* base text */  --color-navy-900: #081e2b;

  --color-gold-50:  #fbf6e3; --color-gold-100: #f4e9b8; --color-gold-200: #ecdb8c;
  --color-gold-300: #e3cc60; --color-gold-400: #d6b732; /* nav accent */
  --color-gold-500: #bda021; --color-gold-600: #9c831b; --color-gold-700: #7a6615;
  --color-gold-800: #594a0f; --color-gold-900: #382e09;
}
```

The `@tailwindcss/vite` plugin compiles this; **no `postcss.config` is needed**
([11-dependencies.md](./11-dependencies.md)). Because we style with Tailwind, we do
**not** pull `postcss-preset-mantine` (only needed when authoring Mantine CSS mixins).

### Mantine theme bridge (minimal)

A tiny Mantine theme makes Mantine's own internals (focus rings, the date picker's
selected day, `Switch` checked state) use the brand maroon — so the parts we don't
hand-style still match. The hex values are the **same tokens** as above, kept in
sync by hand (two short tuples).

```ts
// apps/frontend/src/theme.ts  (consumed by MantineProvider in main.tsx)
import { createTheme, type MantineColorsTuple } from '@mantine/core'

const brand: MantineColorsTuple = [
  '#fce9ea', '#f5bcc0', '#ec9aa1', '#e0727b', '#d24e58',
  '#a82832', '#781118', '#701016', '#560c11', '#2d0609',
] // index 6 = #781118 (canonical maroon)

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: 6,
  colors: { brand },
  black: '#0a2434',             // navy base as the "black" for text
})
```

```tsx
// main.tsx
<MantineProvider theme={theme} defaultColorScheme="light">…</MantineProvider>
```

## Component conventions (Tailwind utilities)

Style with utility classes; compose conditionals with `cn()` ([08-conventions.md](./08-conventions.md)).

| Element | Treatment (Tailwind) |
|---------|----------------------|
| Primary button (`Simpan`, `Tambah`, `Pinjam`) | `bg-brand-600 text-white hover:bg-brand-700` |
| Return action (`Kembalikan`) | `bg-brand-50 text-brand-700 hover:bg-brand-100` — frequent, friendly, not destructive |
| Secondary/cancel (`Batal`) | `bg-transparent text-navy-700 hover:bg-navy-50` |
| Destructive (`Hapus`) | `bg-red-600 text-white hover:bg-red-700` (semantic red, **not** brand maroon) |
| Links / active nav item | `text-brand-600`; active sidebar item highlights with `text-gold-400` on the dark surface |
| Sidebar / header (`AppShell`) | `bg-navy-800 text-white`; gold accents only |
| Headings / body text | `text-navy-800` |
| Stat cards | neutral `bg-white border border-navy-100`; the **Terlambat** and **Total Denda** cards add `text-red-600` / amber accents to flag attention |

> **Maroon is the brand, red is a status.** Delete and the overdue badge use
> semantic `red-*`, kept visually distinct from brand maroon so "this is destructive
> / overdue" never reads as "this is on-brand."

## Status badge tones (authoritative mapping)

These **must match** [03-business-rules.md](./03-business-rules.md) and live in
`apps/frontend/src/lib/labels.ts` (which returns a label + a Tailwind class set).
Status uses **semantic** colors — intentionally separate from the brand tokens so
status is never confused with chrome. The status shown is the **effective** status
(`statusEfektif`).

| Effective status | Label (ID) | Tailwind classes |
|------------------|-----------|------------------|
| `dipinjam` | Dipinjam | `bg-blue-100 text-blue-800` |
| `terlambat` | Terlambat | `bg-red-100 text-red-800` |
| `dikembalikan` | Dikembalikan | `bg-green-100 text-green-800` |

### Book stock badge

| Condition | Label (ID) | Tailwind classes |
|-----------|-----------|------------------|
| `stok_tersedia = 0` | Habis | `bg-red-100 text-red-800` |
| `0 < stok_tersedia < stok` | Tersedia (sebagian) | `bg-yellow-100 text-yellow-800` |
| `stok_tersedia = stok` | Tersedia | `bg-green-100 text-green-800` |

## Do / Don't

- ✅ Reference Tailwind brand tokens (`bg-brand-600`, `text-navy-800`) — never
  hard-code hex or use arbitrary values like `bg-[#781118]` in components.
- ✅ Keep gold as an accent on dark surfaces only.
- ✅ Use semantic colors (`green`/`red`/`yellow`/`blue`) for status, brand for identity.
- ✅ Keep the Mantine `mantine` layer ordered **before** Tailwind's layers.
- ❌ Don't use gold for text on white (contrast fail).
- ❌ Don't use brand maroon for "Hapus" — that's semantic `red`.
- ❌ Don't introduce a fourth brand hue; the palette is maroon + navy + gold.
