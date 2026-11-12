import { describe, expect, it } from 'vitest'
import { tramoRecorrido } from './recorrido'

// Línea que sale del origen, pasa por A, sigue hasta B y termina en C.
const linea: [number, number][] = [
  [0, 0],
  [0, 1],
  [0, 2], // A
  [1, 2],
  [2, 2], // B
  [2, 3],
  [2, 4], // C
]
const A = { lat: 2, lng: 0 }
const B = { lat: 2, lng: 2 }
const C = { lat: 4, lng: 2 }

describe('tramoRecorrido', () => {
  it('sin paradas pasadas no hay tramo', () => {
    expect(tramoRecorrido(linea, [A, B, C], 0)).toEqual([])
  })
  it('crece con cada parada pasada y llega hasta ella', () => {
    expect(tramoRecorrido(linea, [A, B, C], 1)).toEqual(linea.slice(0, 3))
    expect(tramoRecorrido(linea, [A, B, C], 2)).toEqual(linea.slice(0, 5))
    expect(tramoRecorrido(linea, [A, B, C], 3)).toEqual(linea)
  })
  it('una ruta que cruza sus calles no salta atrás', () => {
    // La línea vuelve a pasar por el origen: la parada B debe ubicarse después de A.
    const vuelta: [number, number][] = [[0, 0], [0, 2], [0, 0], [3, 0]]
    expect(tramoRecorrido(vuelta, [{ lat: 2, lng: 0 }, { lat: 0, lng: 3 }], 2)).toEqual(vuelta)
  })
})
