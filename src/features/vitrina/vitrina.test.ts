import { describe, expect, it } from 'vitest'
import seed from '../../data/seed.json'
import type { Comercio } from '../../types/contratos'
import { TIPOS, contarPorTipo, filtrarComercios, ilustracionDeTipo } from './vitrina'
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
