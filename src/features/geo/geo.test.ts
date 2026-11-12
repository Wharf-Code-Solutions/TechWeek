import { describe, expect, it } from 'vitest'
import { distanciaM } from './distancia'
import { crearRecorrido } from './recorridoVirtual'
import { RECORRIDO_DEMO, PARADAS_DEMO } from './rutaDemo'
import { lugarCercano } from './useLlegada'
import { claveRuta, lineaRecta } from './useRutaCaminable'
import { RADIO_CENTRO_M, ZOCALO, distanciaAlCentro, estaLejosDelCentro } from './centro'
import { anguloRelativo, rumboHacia } from './recorridoVirtual'
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

describe('recorrido virtual', () => {
  it('la demo tiene 5 paradas en orden', () => {
    expect(PARADAS_DEMO.map((p) => p.slug)).toEqual([
      'catedral',
      'condesa-malibran',
      'baluarte-santiago',
      'portales',
      'zocalo',
    ])
  })

  it('empieza en la primera parada y termina en la última', () => {
    const ini = RECORRIDO_DEMO.en(0)
    const fin = RECORRIDO_DEMO.en(RECORRIDO_DEMO.totalM)
    expect(distanciaM(ini, PARADAS_DEMO[0])).toBeLessThan(1)
    expect(distanciaM(fin, PARADAS_DEMO[4])).toBeLessThan(1)
  })

  it('limita los metros a la ruta', () => {
    expect(RECORRIDO_DEMO.en(-50)).toEqual(RECORRIDO_DEMO.en(0))
    const fin = RECORRIDO_DEMO.en(RECORRIDO_DEMO.totalM)
    expect(RECORRIDO_DEMO.en(RECORRIDO_DEMO.totalM + 999).lat).toBeCloseTo(fin.lat, 8)
  })

  it('en cada parada queda a menos de 40 m de ella', () => {
    PARADAS_DEMO.forEach((p, i) => {
      const pos = RECORRIDO_DEMO.en(RECORRIDO_DEMO.metrosDeParada(i))
      expect(distanciaM(pos, p)).toBeLessThan(40)
    })
  })

  it('el rumbo va hacia el norte en una ruta hacia el norte', () => {
    const r = crearRecorrido([
      { lat: 19.0, lng: -96.0 },
      { lat: 19.01, lng: -96.0 },
    ])
    expect(r.en(100).rumbo).toBeLessThan(1)
    expect(r.paradaActual(r.totalM)).toBe(1)
  })

  it('exige al menos 2 puntos', () => {
    expect(() => crearRecorrido([A])).toThrow()
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

describe('recorrido por calles', () => {
  const a = { lat: 19.2, lng: -96.14 }
  const b = { lat: 19.2, lng: -96.13 }
  // Un tramo que da la vuelta por el norte: más largo que la línea recta.
  const rodeo: [number, number][] = [[-96.14, 19.201], [-96.13, 19.201]]

  it('sigue el trazado y pasa por las paradas', () => {
    const recto = crearRecorrido([a, b])
    const calles = crearRecorrido([a, b], [rodeo])
    expect(calles.totalM).toBeGreaterThan(recto.totalM)
    expect(distanciaM(calles.en(0), a)).toBeLessThan(1)
    expect(distanciaM(calles.en(calles.totalM), b)).toBeLessThan(1)
    expect(calles.metrosDeParada(1)).toBeCloseTo(calles.totalM, 5)
  })

  it('la demo sigue las calles: es más larga que unir las paradas en línea recta', () => {
    expect(RECORRIDO_DEMO.totalM).toBeGreaterThan(crearRecorrido(PARADAS_DEMO).totalM)
    PARADAS_DEMO.forEach((p, i) =>
      expect(distanciaM(RECORRIDO_DEMO.en(RECORRIDO_DEMO.metrosDeParada(i)), p)).toBeLessThan(1),
    )
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

describe('guía de dirección', () => {
  const origen = { lat: 19.2, lng: -96.14 }
  it('rumbo hacia el norte, este, sur y oeste', () => {
    expect(rumboHacia(origen, { lat: 19.21, lng: -96.14 })).toBeCloseTo(0, 0)
    expect(rumboHacia(origen, { lat: 19.2, lng: -96.13 })).toBeCloseTo(90, 0)
    expect(rumboHacia(origen, { lat: 19.19, lng: -96.14 })).toBeCloseTo(180, 0)
    expect(rumboHacia(origen, { lat: 19.2, lng: -96.15 })).toBeCloseTo(270, 0)
  })
  it('ángulo relativo: al frente, derecha, izquierda y atrás', () => {
    expect(anguloRelativo(90, 90)).toBe(0)
    expect(anguloRelativo(0, 90)).toBe(90)
    expect(anguloRelativo(90, 0)).toBe(-90)
    expect(anguloRelativo(0, 180)).toBe(180)
    expect(anguloRelativo(350, 10)).toBe(20) // cruza el norte sin dar la vuelta larga
  })
})

describe('tramo del camino', () => {
  it('empieza y termina en las distancias pedidas', () => {
    const t = RECORRIDO_DEMO.camino(100, 400)
    const ini = RECORRIDO_DEMO.en(100)
    const fin = RECORRIDO_DEMO.en(400)
    expect(distanciaM({ lat: t[0][1], lng: t[0][0] }, ini)).toBeLessThan(1)
    expect(distanciaM({ lat: t[t.length - 1][1], lng: t[t.length - 1][0] }, fin)).toBeLessThan(1)
    expect(t.length).toBeGreaterThan(10)
  })
  it('no importa el orden de las distancias y un tramo vacío da un solo punto', () => {
    expect(RECORRIDO_DEMO.camino(400, 100).length).toBe(RECORRIDO_DEMO.camino(100, 400).length)
    expect(RECORRIDO_DEMO.camino(50, 50)).toHaveLength(1)
  })
})
