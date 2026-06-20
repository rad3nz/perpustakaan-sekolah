import { Table } from '@mantine/core'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  /** Cell + header alignment. Use 'right' for numeric columns. */
  align?: 'left' | 'right' | 'center'
}

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const

/** Borderless table meant to live inside a Surface panel (the panel owns the border).
 *  Header is tinted + uppercase; rows highlight on hover; numeric columns right-align. */
export function DataTable<T extends { id: number }>({
  columns,
  rows,
  empty = 'Belum ada data.',
  loading = false,
}: {
  columns: Column<T>[]
  rows: T[]
  empty?: string
  loading?: boolean
}) {
  return (
    <Table.ScrollContainer minWidth={640}>
      <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead className="bg-navy-50">
          <Table.Tr>
            {columns.map((c) => (
              <Table.Th
                key={c.key}
                className={cn(
                  'font-semibold text-navy-600 text-xs uppercase tracking-wide',
                  alignClass[c.align ?? 'left'],
                )}
              >
                {c.header}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <StateRow span={columns.length}>Memuat…</StateRow>
          ) : rows.length === 0 ? (
            <StateRow span={columns.length}>{empty}</StateRow>
          ) : (
            rows.map((row) => (
              <Table.Tr key={row.id}>
                {columns.map((c) => (
                  <Table.Td
                    key={c.key}
                    className={cn('text-navy-800', alignClass[c.align ?? 'left'])}
                  >
                    {c.render(row)}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

function StateRow({ span, children }: { span: number; children: ReactNode }) {
  return (
    <Table.Tr>
      <Table.Td colSpan={span} className="py-12 text-center text-navy-500 text-sm">
        {children}
      </Table.Td>
    </Table.Tr>
  )
}
