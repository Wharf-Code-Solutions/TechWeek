import { describe, expect, it } from 'vitest'
import { paradasBrillo } from './brillo'

const A = '#00f'
const B = '#fff'

describe('brillo de la ruta', () => {
  it('las paradas siempre son ascendentes y empiezan en 0', () => {
    for (let p = -0.2; p <= 1.2; p += 0.05) {
      const ps = paradasBrillo(p, A, B)
      expect(ps[0][0]).toBe(0)
      expect(ps.length).toBeGreaterThanOrEqual(2)
      for (let i = 1; i < ps.length; i++) expect(ps[i][0]).toBeGreaterThan(ps[i - 1][0])
      expect(ps[ps.length - 1][0]).toBeLessThanOrEqual(1)
    }
  })
  it('la franja clara está donde dice p', () => {
    const ps = paradasBrillo(0.5, A, B)
    expect(ps.find(([, c]) => c === B)?.[0]).toBeCloseTo(0.5, 5)
  })
  it('fuera de la línea no se ve brillo', () => {
    expect(paradasBrillo(-0.5, A, B).some(([, c]) => c === B)).toBe(false)
    expect(paradasBrillo(1.5, A, B).some(([, c]) => c === B)).toBe(false)
  })
})
