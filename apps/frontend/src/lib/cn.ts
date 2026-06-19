import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Compose conditional Tailwind classes; tailwind-merge resolves conflicts (last wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
