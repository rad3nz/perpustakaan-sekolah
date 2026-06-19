import { t } from 'elysia'

/** Reusable TypeBox fields for list pagination (CRUD-03). */
export const pageQuery = {
  page: t.Optional(t.Numeric({ minimum: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
}

/** Apply defaults (page 1, limit 20) and the max-100 cap. */
export function clampPaging(q: { page?: number; limit?: number }) {
  return { page: q.page ?? 1, limit: Math.min(q.limit ?? 20, 100) }
}
