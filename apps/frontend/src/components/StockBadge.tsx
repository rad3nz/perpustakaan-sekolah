import { cn } from '../lib/cn'
import { stockBadge } from '../lib/labels'

export function StockBadge({ stok, stokTersedia }: { stok: number; stokTersedia: number }) {
  const b = stockBadge(stokTersedia, stok)
  return (
    <span className={cn('inline-block rounded-full px-2 py-0.5 font-medium text-xs', b.className)}>
      {b.label}
    </span>
  )
}
