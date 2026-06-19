// Eden contract: re-export the backend App type so the frontend (which depends only on
// @perpustakaan/shared) builds its typed client from it. Type-only — erased at build.
export type { App } from '@perpustakaan/backend'
export * from './dto'
export * from './enums'
