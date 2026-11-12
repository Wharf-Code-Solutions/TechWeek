import { describe, expect, it } from 'vitest'
import { cifras, distanciaLegible } from './texto'

const et = { paradas: 'lugares', tlacos: 'doblones', distancia: 'caminados' }

describe('distanciaLegible', () => {
  it('usa metros por debajo de 1 km y km después', () => {
    expect(distanciaLegible(850.4)).toBe('850 m')
    expect(distanciaLegible(1234)).toBe('1.2 km')
  })
})

describe('cifras', () => {
  it('siempre trae los lugares y omite lo que falta', () => {
    expect(cifras({ paradas: 5 }, et)).toEqual([['lugares', '5']])
    expect(cifras({ paradas: 5, tlacos: 120, metros: 0 }, et)).toEqual([
      ['lugares', '5'],
      ['doblones', '120'],
    ])
  })
  it('agrega la distancia cuando hay', () => {
    expect(cifras({ paradas: 3, tlacos: 10, metros: 900 }, et)[2]).toEqual(['caminados', '900 m'])
  })
})
