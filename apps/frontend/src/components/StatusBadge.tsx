import type { PeminjamanStatusEfektif } from '@perpustakaan/shared'
import { cn } from '../lib/cn'
import { labelStatus, statusBadgeClasses } from '../lib/labels'

export function StatusBadge({ status }: { status: PeminjamanStatusEfektif }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2 py-0.5 font-medium text-xs',
        statusBadgeClasses(status),
      )}
    >
      {labelStatus(status)}
    </span>
  )
}
