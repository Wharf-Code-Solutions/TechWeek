import { describe, expect, it } from 'vitest'
import seed from '../../data/seed.json'
import type { Comercio } from '../../types/contratos'
import { TIPOS, TIPOS_COMIDA, comidaCercana, contarPorTipo, filtrarComercios, ilustracionDeTipo } from './vitrina'
import { urlIlustracion } from '../../components/ui/ilustraciones'

const comercios = seed.comercios as unknown as Comercio[]

const falso = (slug: string, nombre: string, tipo: Comercio['tipo'], aliado: boolean): Comercio => ({
  slug,
  nombre,
  categoria: 'comida',
  tipo,
  lat: 0,
  lng: 0,
  descripcion_es: '',
  descripcion_en: '',
  direccion: '',
  horario_es: '',
  horario_en: '',
  aliado,
})

describe('vitrina', () => {
  it('filtra por tipo y sin tipo devuelve todos', () => {
    expect(filtrarComercios(comercios, null)).toHaveLength(comercios.length)
    const neverias = filtrarComercios(comercios, 'neveria')
    expect(neverias.length).toBeGreaterThan(0)
    expect(neverias.every((c) => c.tipo === 'neveria')).toBe(true)
  })

  it('pone primero a los aliados y luego ordena por nombre', () => {
    const lista = filtrarComercios(
      [falso('a', 'Zeta', 'fonda', false), falso('b', 'Beta', 'fonda', true), falso('c', 'Alfa', 'fonda', false)],
      null,
    )
    expect(lista.map((c) => c.nombre)).toEqual(['Beta', 'Alfa', 'Zeta'])
  })

  it('no modifica la lista original', () => {
    const original = [falso('a', 'Zeta', 'fonda', false), falso('b', 'Beta', 'fonda', true)]
    filtrarComercios(original, null)
    expect(original.map((c) => c.slug)).toEqual(['a', 'b'])
  })

  it('cuenta los comercios por tipo', () => {
    const cuenta = contarPorTipo(comercios)
    expect(Object.values(cuenta).reduce((a, b) => a + (b ?? 0), 0)).toBe(comercios.length)
  })

  it('todos los tipos del seed están en los filtros y cada tipo tiene una ilustración del set', () => {
    for (const c of comercios) expect(TIPOS).toContain(c.tipo)
    for (const t of TIPOS) {
      expect(ilustracionDeTipo(t)).toBeTruthy()
      expect(urlIlustracion(ilustracionDeTipo(t))).toBeTruthy()
    }
  })
})

describe('restaurantes disponibles', () => {
  const zocalo = { lat: 19.20023, lng: -96.13853 }
  const en = (slug: string, tipo: Comercio['tipo'], aliado: boolean, dlat: number): Comercio => ({
    ...falso(slug, slug, tipo, aliado),
    lat: zocalo.lat + dlat,
    lng: zocalo.lng,
  })

  it('solo incluye lugares de comer', () => {
    const lista = comidaCercana(comercios, null)
    expect(lista.length).toBeGreaterThan(0)
    expect(lista.every((x) => TIPOS_COMIDA.includes(x.comercio.tipo))).toBe(true)
    expect(lista.some((x) => x.comercio.tipo === 'libreria')).toBe(false)
  })

  it('aliados primero y luego el más cercano', () => {
    const lista = comidaCercana(
      [en('lejos', 'fonda', false, 0.01), en('cerca', 'fonda', false, 0.001), en('aliado-lejos', 'neveria', true, 0.02)],
      zocalo,
    )
    expect(lista.map((x) => x.comercio.slug)).toEqual(['aliado-lejos', 'cerca', 'lejos'])
    expect(lista[1].metros).toBeLessThan(lista[2].metros ?? 0)
  })

  it('sin posición no hay distancias y se ordena por nombre', () => {
    const lista = comidaCercana([en('b', 'fonda', false, 0), en('a', 'fonda', false, 0)], null)
    expect(lista.map((x) => x.comercio.slug)).toEqual(['a', 'b'])
    expect(lista.every((x) => x.metros === null)).toBe(true)
  })
})
