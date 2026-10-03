import { RACES_PER_DAY, SNAILS } from '../config/race'
import type { BetSummary, Race, RaceDay, SnailWins } from '../types/race.types'

// Convierte el texto de la semilla en un número de 32 bits (FNV-1a).
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

// Generador pseudoaleatorio con semilla (mulberry32). Math.random no acepta semilla:
// con este, la misma semilla siempre produce los mismos resultados.
function createRandom(seed: string): () => number {
  let state = hashSeed(seed)
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickSnailId(random: () => number): string {
  return SNAILS[Math.floor(random() * SNAILS.length)].id
}

function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// Las victorias y las apuestas se calculan de las mismas carreras: los datos de las dos gráficas son congruentes.
function countWins(races: Race[]): SnailWins[] {
  return SNAILS.map((snail) => ({
    snail,
    wins: races.filter((race) => race.winnerId === snail.id).length,
  }))
}

function countBets(races: Race[]): BetSummary {
  const won = races.filter((race) => race.betSnailId === race.winnerId).length
  return { won, lost: races.length - won }
}

export const raceService = {
  // Semilla usuario + día: los datos no cambian al recargar la página, pero sí de un día a otro.
  simulateDay(userId: string, date: Date = new Date()): RaceDay {
    const dateKey = toDateKey(date)
    const random = createRandom(`${userId}:${dateKey}`)

    const races: Race[] = Array.from({ length: RACES_PER_DAY }, (_, index) => ({
      number: index + 1,
      winnerId: pickSnailId(random),
      betSnailId: pickSnailId(random),
    }))

    return { date: dateKey, races, wins: countWins(races), bets: countBets(races) }
  },
}
