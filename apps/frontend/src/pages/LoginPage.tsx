import { Button, Card, PasswordInput, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../auth/auth-store'
import { useAuth } from '../auth/useAuth'
import { getErrorMessage } from '../lib/api-error'

export function LoginPage() {
  const token = useAuthStore((s) => s.token)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const form = useForm({
    initialValues: { username: '', password: '' },
    validate: {
      username: (v) => (v ? null : 'Username wajib diisi.'),
      password: (v) => (v ? null : 'Password wajib diisi.'),
    },
  })

  if (token) return <Navigate to="/" replace />

  async function onSubmit(values: { username: string; password: string }) {
    setError('')
    setLoading(true)
    try {
      await login(values.username, values.password)
      navigate('/')
    } catch (e) {
      setError(getErrorMessage(e, 'Username atau password salah.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50 p-4">
      <Card className="w-full max-w-sm border border-navy-100 bg-white p-6 shadow-md" radius="lg">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-600 font-bold text-gold-400 text-xl">
          P
        </div>
        <Title order={2} className="text-navy-800 tracking-tight">
          Perpustakaan Sekolah
        </Title>
        <Text size="sm" className="mb-4 text-navy-600">
          Masuk untuk melanjutkan
        </Text>
        <form onSubmit={form.onSubmit(onSubmit)} className="flex flex-col gap-3">
          <TextInput label="Username" {...form.getInputProps('username')} />
          <PasswordInput label="Password" {...form.getInputProps('password')} />
          {error && (
            <Text size="sm" className="text-red-600">
              {error}
            </Text>
          )}
          <Button type="submit" loading={loading} fullWidth className="mt-1">
            Masuk
          </Button>
        </form>
      </Card>
    </div>
  )
}
