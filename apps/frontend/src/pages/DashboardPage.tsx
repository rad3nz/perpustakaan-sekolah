import { SimpleGrid, Title } from '@mantine/core'
import { useDashboard } from '../api/hooks/useDashboard'
import { StatCard } from '../components/StatCard'
import { formatRupiah } from '../lib/format'

export function DashboardPage() {
  const { data } = useDashboard()
  return (
    <div>
      <Title order={2} className="mb-4 text-navy-800">
        Dashboard
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }}>
        <StatCard label="Total Buku" value={data?.totalBuku ?? 0} />
        <StatCard label="Total Anggota" value={data?.totalAnggota ?? 0} />
        <StatCard label="Sedang Dipinjam" value={data?.peminjamanAktif ?? 0} />
        <StatCard label="Terlambat" value={data?.terlambat ?? 0} accent="red" />
        <StatCard label="Total Denda" value={formatRupiah(data?.totalDenda ?? 0)} accent="amber" />
      </SimpleGrid>
    </div>
  )
}
