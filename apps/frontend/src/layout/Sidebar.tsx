import { NavLink } from 'react-router-dom'
import { cn } from '../lib/cn'

const items = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/buku', label: 'Buku', end: false },
  { to: '/anggota', label: 'Anggota', end: false },
  { to: '/peminjaman', label: 'Peminjaman', end: false },
]

export function Sidebar() {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) =>
            cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-600 text-gold-400'
                : 'text-white/80 hover:bg-navy-700 hover:text-white',
            )
          }
        >
          {it.label}
        </NavLink>
      ))}
    </nav>
  )
}
