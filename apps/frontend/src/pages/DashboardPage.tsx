import { SimpleGrid } from '@mantine/core'
import { useDashboard } from '../api/hooks/useDashboard'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { formatRupiah } from '../lib/format'

export function DashboardPage() {
  const { data } = useDashboard()
  return (
    <div>
      <PageHeader title="Dashboard" description="Ringkasan koleksi, anggota, dan peminjaman." />
      <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 5 }} spacing="md">
        <StatCard label="Total Buku" value={data?.totalBuku ?? 0} />
        <StatCard label="Total Anggota" value={data?.totalAnggota ?? 0} />
        <StatCard label="Sedang Dipinjam" value={data?.peminjamanAktif ?? 0} />
        <StatCard label="Terlambat" value={data?.terlambat ?? 0} accent="red" />
        <StatCard label="Total Denda" value={formatRupiah(data?.totalDenda ?? 0)} accent="amber" />
      </SimpleGrid>
    </div>
  )
}
