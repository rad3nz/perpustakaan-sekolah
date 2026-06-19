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
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text className="font-bold text-navy-800">Perpustakaan Sekolah</Text>
          </Group>
          <Group>
            <Text size="sm" className="text-navy-700">
              {user?.nama}
            </Text>
            <Button
              size="xs"
              variant="subtle"
              onClick={handleLogout}
              className="text-navy-700 hover:bg-navy-50"
            >
              Keluar
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar className="border-0 bg-navy-800">
        <Sidebar />
      </AppShell.Navbar>
      <AppShell.Main className="bg-navy-50">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
