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
      <p className="px-3 pt-2 pb-1 font-semibold text-white/40 text-xs uppercase tracking-widest">
        Menu
      </p>
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) =>
            cn(
              'relative flex items-center gap-2.5 rounded-md py-2 pr-3 pl-2.5 font-medium text-sm transition-colors',
              isActive
                ? 'bg-brand-600 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'h-4 w-1 rounded-full transition-colors',
                  isActive ? 'bg-gold-400' : 'bg-transparent',
                )}
              />
              {it.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
