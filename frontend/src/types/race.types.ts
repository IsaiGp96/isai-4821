export interface Snail {
  id: string
  name: string
}

export interface Race {
  // Número de carrera en el día, empezando en 1.
  number: number
  winnerId: string
  // Caracol al que apostó el usuario en esta carrera.
  betSnailId: string
}

export interface SnailWins {
  snail: Snail
  wins: number
}

export interface BetSummary {
  won: number
  lost: number
}

export interface RaceDay {
  // Fecha local en formato AAAA-MM-DD.
  date: string
  races: Race[]
  wins: SnailWins[]
  bets: BetSummary
}
