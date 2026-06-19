import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../layout/AppLayout'
import { AnggotaListPage } from '../pages/anggota/AnggotaListPage'
import { BukuListPage } from '../pages/buku/BukuListPage'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { PeminjamanListPage } from '../pages/peminjaman/PeminjamanListPage'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: '/buku', element: <BukuListPage /> },
          { path: '/anggota', element: <AnggotaListPage /> },
          { path: '/peminjaman', element: <PeminjamanListPage /> },
        ],
      },
    ],
  },
])
