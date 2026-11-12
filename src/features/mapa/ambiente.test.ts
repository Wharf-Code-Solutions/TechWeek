import { describe, expect, it } from 'vitest'
import { FACHADAS, colorFachada, expresionFachadas } from './ambiente'

describe('fachadas de colores', () => {
  it('el mismo edificio siempre tiene el mismo color', () => {
    expect(colorFachada(12345)).toBe(colorFachada(12345))
  })

  it('reparte los colores de la paleta según el id', () => {
    const usados = new Set(Array.from({ length: 60 }, (_, i) => colorFachada(i)))
    expect(usados.size).toBe(FACHADAS.length)
  })

  it('sin id usa el color neutro', () => {
    expect(colorFachada(undefined)).toBe(FACHADAS[FACHADAS.length - 1])
    expect(colorFachada(Number.NaN)).toBe(FACHADAS[FACHADAS.length - 1])
  })

  it('la expresión de Mapbox tiene un color por resto más el neutro final', () => {
    const e = expresionFachadas()
    expect(e[0]).toBe('match')
    // match + entrada + (n-1 pares) + neutro
    expect(e).toHaveLength(2 + (FACHADAS.length - 1) * 2 + 1)
    expect(e[e.length - 1]).toBe(FACHADAS[FACHADAS.length - 1])
  })
})
