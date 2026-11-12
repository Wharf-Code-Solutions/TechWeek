import { describe, expect, it } from 'vitest'
import { distanciaM } from './distancia'
import { lugarCercano } from './useLlegada'
import { claveRuta, lineaRecta } from './useRutaCaminable'
import { tramoRestante } from './tramo'
import { RADIO_CENTRO_M, ZOCALO, distanciaAlCentro, estaLejosDelCentro } from './centro'
import type { Lugar } from '../../types/contratos'

const A = { lat: 19.19935, lng: -96.13705 }

describe('distanciaM', () => {
  it('es cero en el mismo punto', () => expect(distanciaM(A, A)).toBe(0))
  it('0.0003° de latitud son unos 33 m', () => {
    const d = distanciaM(A, { lat: A.lat + 0.0003, lng: A.lng })
    expect(d).toBeGreaterThan(30)
    expect(d).toBeLessThan(36)
  })
})

describe('lugarCercano', () => {
  const lugar = (slug: string, lat: number): Lugar => ({ slug, lat, lng: A.lng, radio_m: 40 }) as Lugar
  const lugares = [lugar('cerca', A.lat), lugar('lejos', A.lat + 0.01)]

  it('devuelve el lugar dentro del radio', () => {
    expect(lugarCercano(lugares, { ...A, precision: 5, fuente: 'gps' })?.slug).toBe('cerca')
  })
  it('devuelve null fuera del radio o sin posición', () => {
    expect(lugarCercano(lugares, { lat: A.lat + 0.005, lng: A.lng, precision: 5, fuente: 'gps' })).toBeNull()
    expect(lugarCercano(lugares, null)).toBeNull()
  })
})

describe('línea de la ruta', () => {
  const a = { lat: 19.2, lng: -96.14 }
  const b = { lat: 19.2, lng: -96.13 }
  it('la clave cambia si cambia el punto de partida (y se redondea a unos 10 m)', () => {
    const paradas = [{ slug: 'a' }, { slug: 'b' }]
    expect(claveRuta(paradas, a)).not.toBe(claveRuta(paradas))
    expect(claveRuta(paradas, a)).toBe(claveRuta(paradas, { lat: a.lat + 0.00001, lng: a.lng }))
    expect(claveRuta(paradas, a)).not.toBe(claveRuta(paradas, { lat: a.lat + 0.01, lng: a.lng }))
  })

  it('claveRuta y lineaRecta', () => {
    expect(claveRuta([{ slug: 'a' }, { slug: 'b' }])).toBe('a|b')
    expect(lineaRecta([a, b])).toEqual([[-96.14, 19.2], [-96.13, 19.2]])
  })
})

describe('lejos del Centro', () => {
  it('en el Zócalo y a unas cuadras no es lejos', () => {
    expect(estaLejosDelCentro(ZOCALO)).toBe(false)
    expect(estaLejosDelCentro({ lat: ZOCALO.lat + 0.004, lng: ZOCALO.lng })).toBe(false)
  })
  it('a varios kilómetros sí es lejos (y sin posición no se avisa)', () => {
    const lejos = { lat: ZOCALO.lat + 0.1, lng: ZOCALO.lng } // unos 11 km
    expect(distanciaAlCentro(lejos)).toBeGreaterThan(RADIO_CENTRO_M)
    expect(estaLejosDelCentro(lejos)).toBe(true)
    expect(estaLejosDelCentro(null)).toBe(false)
  })
})

describe('tramo restante de la línea', () => {
  // Una línea de oeste a este con 5 vértices separados ~100 m.
  const linea: [number, number][] = [0, 1, 2, 3, 4].map((i) => [-96.14 + i * 0.001, 19.2])
  const en = (i: number) => ({ lat: 19.2, lng: -96.14 + i * 0.001 })

  it('va de la posición a la parada siguiendo la línea', () => {
    const t = tramoRestante(linea, { lat: 19.2001, lng: -96.1389 }, en(3))
    expect(t[0]).toEqual([-96.1389, 19.2001])
    expect(t[t.length - 1]).toEqual([en(3).lng, en(3).lat])
    expect(t.length).toBeGreaterThanOrEqual(3)
  })

  it('si la parada quedó atrás, devuelve el segmento recto', () => {
    const t = tramoRestante(linea, en(3), en(1))
    expect(t).toHaveLength(2)
  })

  it('con una línea vacía o de un punto también devuelve el segmento recto', () => {
    expect(tramoRestante([], en(0), en(2))).toHaveLength(2)
    expect(tramoRestante([[-96.14, 19.2]], en(0), en(2))).toHaveLength(2)
  })
})

