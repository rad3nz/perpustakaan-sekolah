import { cn } from '../lib/cn'

const ACCENT = {
  default: { bar: 'bg-brand-600', value: 'text-navy-800' },
  red: { bar: 'bg-red-500', value: 'text-red-600' },
  amber: { bar: 'bg-gold-400', value: 'text-gold-600' },
} as const

export function StatCard({
  label,
  value,
  accent = 'default',
}: {
  label: string
  value: string | number
  accent?: keyof typeof ACCENT
}) {
  const a = ACCENT[accent]
  return (
    <div className="flex items-stretch gap-3 overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
      <span className={cn('w-1 shrink-0', a.bar)} aria-hidden />
      <div className="py-4 pr-4">
        <div className="font-medium text-navy-500 text-xs uppercase tracking-wide">{label}</div>
        <div className={cn('mt-1 font-bold text-2xl tabular-nums', a.value)}>{value}</div>
      </div>
    </div>
  )
}
