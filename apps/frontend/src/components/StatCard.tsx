import { cn } from '../lib/cn'

export function StatCard({
  label,
  value,
  accent = 'default',
}: {
  label: string
  value: string | number
  accent?: 'default' | 'red' | 'amber'
}) {
  return (
    <div className="rounded-lg border border-navy-100 bg-white p-4 shadow-sm">
      <div className="text-navy-600 text-sm">{label}</div>
      <div
        className={cn(
          'mt-1 font-bold text-2xl',
          accent === 'red'
            ? 'text-red-600'
            : accent === 'amber'
              ? 'text-amber-600'
              : 'text-navy-800',
        )}
      >
        {value}
      </div>
    </div>
  )
}
