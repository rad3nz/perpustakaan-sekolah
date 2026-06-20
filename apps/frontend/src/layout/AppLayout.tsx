import { AppShell, Burger, Button, Group, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header className="border-navy-100 border-b bg-white">
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 font-bold text-gold-400 text-sm">
              P
            </div>
            <Text className="font-semibold text-navy-800 tracking-tight">Perpustakaan Sekolah</Text>
          </Group>
          <Group gap="sm">
            <Text size="sm" className="hidden text-navy-600 sm:block">
              {user?.nama}
            </Text>
            <Button size="xs" variant="subtle" color="brand" onClick={handleLogout}>
              Keluar
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar className="border-0 bg-navy-800">
        <Sidebar />
      </AppShell.Navbar>
      <AppShell.Main className="bg-navy-50">
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  )
}
