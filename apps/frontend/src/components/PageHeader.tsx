import type { ReactNode } from 'react'

/** Consistent page heading: title (+ optional supporting line) on the left, an
 *  actions slot on the right. Keeps the title→action spacing identical everywhere. */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-semibold text-2xl text-navy-800 tracking-tight">{title}</h1>
        {description && <p className="mt-0.5 text-navy-500 text-sm">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
