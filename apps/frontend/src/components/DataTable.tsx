import { Table } from '@mantine/core'
import type { ReactNode } from 'react'

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
}

export function DataTable<T extends { id: number }>({
  columns,
  rows,
  empty = 'Tidak ada data.',
  loading = false,
}: {
  columns: Column<T>[]
  rows: T[]
  empty?: string
  loading?: boolean
}) {
  return (
    <Table.ScrollContainer minWidth={640}>
      <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            {columns.map((c) => (
              <Table.Th key={c.key}>{c.header}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length} className="text-center text-navy-500">
                Memuat…
              </Table.Td>
            </Table.Tr>
          ) : rows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length} className="text-center text-navy-500">
                {empty}
              </Table.Td>
            </Table.Tr>
          ) : (
            rows.map((row) => (
              <Table.Tr key={row.id}>
                {columns.map((c) => (
                  <Table.Td key={c.key}>{c.render(row)}</Table.Td>
                ))}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
