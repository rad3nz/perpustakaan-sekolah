import { TextInput } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'

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
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    if (local === value) return
    const t = setTimeout(() => onChangeRef.current(local), 300)
    return () => clearTimeout(t)
  }, [local, value])

  return (
    <TextInput
      value={local}
      onChange={(e) => setLocal(e.currentTarget.value)}
      placeholder={placeholder}
      className="w-full max-w-xs"
    />
  )
}
