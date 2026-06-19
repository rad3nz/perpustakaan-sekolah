import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, test } from 'vitest'
import { useAuthStore } from '../auth/auth-store'
import { ProtectedRoute } from './ProtectedRoute'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Halaman Login</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Halaman Dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null })
})

test('tanpa sesi → diarahkan ke /login', () => {
  renderAt('/')
  expect(screen.getByText('Halaman Login')).toBeInTheDocument()
})

test('dengan sesi → menampilkan halaman terproteksi', () => {
  useAuthStore.setState({ token: 'token-abc', user: null })
  renderAt('/')
  expect(screen.getByText('Halaman Dashboard')).toBeInTheDocument()
})
