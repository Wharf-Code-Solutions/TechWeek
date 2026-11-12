import { describe, expect, it } from 'vitest'
import { posicionPieza } from './tipos'

describe('rompecabezas 3×2', () => {
  it('coloca las esquinas en los bordes de la foto', () => {
    expect(posicionPieza(0, 6)).toBe('0% 0%')
    expect(posicionPieza(2, 6)).toBe('100% 0%')
    expect(posicionPieza(3, 6)).toBe('0% 100%')
    expect(posicionPieza(5, 6)).toBe('100% 100%')
  })
  it('la pieza del centro queda a la mitad', () => {
    expect(posicionPieza(1, 6)).toBe('50% 0%')
  })
})
