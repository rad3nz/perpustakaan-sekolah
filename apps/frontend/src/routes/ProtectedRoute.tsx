import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../auth/auth-store'

/** Gates the app: redirects to /login when there is no session. */
export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}
