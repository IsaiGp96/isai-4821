import type { Snail } from '../types/race.types'

// Reglas del día simulado: 6 caracoles y 6 carreras, una apuesta del usuario por carrera.
export const RACES_PER_DAY = 6

export const SNAILS: readonly Snail[] = [
  { id: 'turbo', name: 'Turbo' },
  { id: 'baba-veloz', name: 'Baba Veloz' },
  { id: 'concha-roja', name: 'Concha Roja' },
  { id: 'rayo-lento', name: 'Rayo Lento' },
  { id: 'espiral', name: 'Espiral' },
  { id: 'don-caparazon', name: 'Don Caparazón' },
]
