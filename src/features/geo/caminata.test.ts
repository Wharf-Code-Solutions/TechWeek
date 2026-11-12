import { describe, expect, it } from 'vitest'
import { dividirPuntos } from './calles'
import { medirLinea, puntoEn } from './caminata'

// Una línea en "L" por dos calles: ~111 m al norte y luego ~105 m al este.
const L: [number, number][] = [
  [-96.14, 19.2],
  [-96.14, 19.201],
  [-96.139, 19.201],
]

describe('caminata por calles', () => {
  it('mide la línea y encuentra el punto a cierta distancia', () => {
    const { acumuladas, total } = medirLinea(L)
    expect(total).toBeGreaterThan(200)
    expect(puntoEn(L, acumuladas, 0)).toEqual({ lat: 19.2, lng: -96.14 })
    expect(puntoEn(L, acumuladas, total + 50)).toEqual({ lat: 19.201, lng: -96.139 })
    // A mitad del primer tramo sigue la calle (misma longitud), sin cortar la esquina.
    const medio = puntoEn(L, acumuladas, acumuladas[1] / 2)
    expect(medio.lng).toBeCloseTo(-96.14, 6)
    expect(medio.lat).toBeCloseTo(19.2005, 4)
  })
})

describe('dividirPuntos', () => {
  it('no parte las rutas cortas', () => {
    expect(dividirPuntos([1, 2, 3])).toEqual([[1, 2, 3]])
  })
  it('parte las largas compartiendo el punto de unión', () => {
    const pts = Array.from({ length: 30 }, (_, i) => i)
    const g = dividirPuntos(pts)
    expect(g).toHaveLength(2)
    expect(g[0]).toHaveLength(25)
    expect(g[1][0]).toBe(g[0][g[0].length - 1])
    expect(g[1][g[1].length - 1]).toBe(29)
  })
})
