import { describe, expect, it } from 'vitest'
import type { Lugar } from '../../types/contratos'
import { formatoDistancia, minutosCaminando, progresoRuta, recortarRuta } from './progreso'

const ruta = ['a', 'b', 'c', 'd', 'e'].map((slug) => ({ slug }) as Lugar)

describe('progreso de la ruta', () => {
  it('la siguiente es la primera sin reto completado', () => {
    const p = progresoRuta(ruta, new Set(['a', 'c']))
    expect(p.siguiente?.slug).toBe('b')
    expect(p).toMatchObject({ completados: 2, total: 5 })
  })
  it('sin pendientes no hay siguiente', () => {
    expect(progresoRuta(ruta, new Set(ruta.map((l) => l.slug))).siguiente).toBeNull()
  })
  it('recortar conserva las hechas y solo 2 pendientes, en orden', () => {
    expect(recortarRuta(ruta, new Set(['a', 'c']))).toEqual(['a', 'b', 'c', 'd'])
    expect(recortarRuta(ruta, new Set())).toEqual(['a', 'b'])
  })
})

describe('distancias', () => {
  it('formatea metros y kilómetros', () => {
    expect(formatoDistancia(118)).toBe('120 m')
    expect(formatoDistancia(1234)).toBe('1.2 km')
  })
  it('minutos caminando, al menos 1', () => {
    expect(minutosCaminando(10)).toBe(1)
    expect(minutosCaminando(400)).toBe(5)
  })
})
