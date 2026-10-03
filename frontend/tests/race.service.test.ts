import { describe, expect, it } from 'vitest'
import { RACES_PER_DAY, SNAILS } from '../src/config/race'
import { raceService } from '../src/services/race.service'

const day = new Date(2026, 9, 2, 10, 0)

describe('raceService - reglas del día', () => {
  it('simula 6 carreras', () => {
    expect(raceService.simulateDay('user-1', day).races).toHaveLength(RACES_PER_DAY)
  })

  it('incluye a los 6 caracoles, aunque no hayan ganado', () => {
    const { wins } = raceService.simulateDay('user-1', day)

    expect(wins.map((entry) => entry.snail.id)).toEqual(SNAILS.map((snail) => snail.id))
  })

  // Se revisan varios usuarios para no depender de un solo resultado aleatorio.
  it.each(['user-1', 'user-2', 'user-3', 'user-4', 'user-5'])(
    'las victorias suman 6 y las apuestas suman 6 (%s)',
    (userId) => {
      const { wins, bets } = raceService.simulateDay(userId, day)

      expect(wins.reduce((total, entry) => total + entry.wins, 0)).toBe(RACES_PER_DAY)
      expect(bets.won + bets.lost).toBe(RACES_PER_DAY)
    },
  )

  it('cuenta como ganada solo la apuesta al caracol ganador', () => {
    const { races, bets } = raceService.simulateDay('user-1', day)
    const expectedWon = races.filter((race) => race.betSnailId === race.winnerId).length

    expect(bets.won).toBe(expectedWon)
  })

  it('cada ganador y cada apuesta es uno de los 6 caracoles', () => {
    const ids = SNAILS.map((snail) => snail.id)
    const { races } = raceService.simulateDay('user-1', day)

    for (const race of races) {
      expect(ids).toContain(race.winnerId)
      expect(ids).toContain(race.betSnailId)
    }
  })
})

describe('raceService - semilla', () => {
  it('devuelve los mismos datos para el mismo usuario y día', () => {
    const later = new Date(2026, 9, 2, 22, 30)

    expect(raceService.simulateDay('user-1', later)).toEqual(raceService.simulateDay('user-1', day))
  })

  it('cambia los datos de un día a otro', () => {
    const nextDay = new Date(2026, 9, 3, 10, 0)

    expect(raceService.simulateDay('user-1', nextDay).races).not.toEqual(
      raceService.simulateDay('user-1', day).races,
    )
  })

  it('usa la fecha local en formato AAAA-MM-DD', () => {
    expect(raceService.simulateDay('user-1', day).date).toBe('2026-10-02')
  })
})
