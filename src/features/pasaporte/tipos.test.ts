import { describe, expect, it } from 'vitest'
import { disenoPiezas, posicionPieza } from './tipos'

describe('diseño de N piezas', () => {
  it('reparte en filas de 2 o 3 tiras, las largas abajo', () => {
    expect(disenoPiezas(1)).toEqual([1])
    expect(disenoPiezas(2)).toEqual([2])
    expect(disenoPiezas(4)).toEqual([2, 2])
    expect(disenoPiezas(5)).toEqual([2, 3])
    expect(disenoPiezas(6)).toEqual([3, 3])
    expect(disenoPiezas(7)).toEqual([2, 2, 3])
    expect(disenoPiezas(10)).toEqual([2, 2, 3, 3])
  })
  it('siempre suma el total y nunca pasa de 3 por fila', () => {
    for (let n = 1; n <= 24; n++) {
      const d = disenoPiezas(n)
      expect(d.reduce((a, b) => a + b, 0)).toBe(n)
      expect(Math.max(...d)).toBeLessThanOrEqual(3)
    }
  })
  it('coloca las esquinas en los bordes de la foto', () => {
    expect(posicionPieza(0, 5)).toBe('0% 0%')
    expect(posicionPieza(1, 5)).toBe('100% 0%')
    expect(posicionPieza(2, 5)).toBe('0% 100%')
    expect(posicionPieza(4, 5)).toBe('100% 100%')
  })
  it('la pieza del centro de una fila de 3 queda a la mitad', () => {
    expect(posicionPieza(3, 5)).toBe('50% 100%')
  })
})

describe('nombre corto del álbum', () => {
  it('se queda con la primera parte', async () => {
    const { nombreCorto } = await import('./tipos')
    expect(nombreCorto('Catedral de la Asunción')).toBe('Catedral')
    expect(nombreCorto('Zócalo / Plaza de Armas')).toBe('Zócalo')
    expect(nombreCorto('Portales y café lechero')).toBe('Portales')
    expect(nombreCorto('Faro')).toBe('Faro')
  })
})
