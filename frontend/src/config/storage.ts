// Claves de LocalStorage. El prefijo evita choques con datos de otras apps en el mismo origen.
export const STORAGE_KEYS = {
  users: 'snailrace.users',
  session: 'snailrace.session',
  recharges: 'snailrace.recharges',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
