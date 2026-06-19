import { TextInput } from '@mantine/core'
import { useEffect, useState } from 'react'

/** Debounced (300ms) text input. Emits the committed value to `onChange`. */
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local)
    }, 300)
    return () => clearTimeout(t)
    // biome-ignore lint/correctness/useExhaustiveDependencies: debounce on local only
  }, [local])

  return (
    <TextInput
      value={local}
      onChange={(e) => setLocal(e.currentTarget.value)}
      placeholder={placeholder}
      className="w-full max-w-xs"
    />
  )
}
