import { Group, Pagination as MantinePagination, Text } from '@mantine/core'

export function Pagination({
  page,
  limit,
  total,
  onChange,
}: {
  page: number
  limit: number
  total: number
  onChange: (p: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / limit))
  return (
    <Group justify="space-between" className="mt-3">
      <Text size="sm" className="text-navy-600">
        Total {total} data
      </Text>
      <MantinePagination value={page} onChange={onChange} total={pages} size="sm" />
    </Group>
  )
}
