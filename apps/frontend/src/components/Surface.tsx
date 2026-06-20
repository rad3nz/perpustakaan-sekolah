import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/** The one card surface. White panel, hairline border, soft shadow — the single
 *  containment primitive every page sits content inside. Pass `p={false}` when the
 *  surface wraps its own padded sections (e.g. a toolbar + table + footer). */
export function Surface({
  children,
  className,
  p = true,
}: {
  children: ReactNode
  className?: string
  p?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-navy-100 bg-white shadow-sm',
        p && 'p-4 sm:p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}
