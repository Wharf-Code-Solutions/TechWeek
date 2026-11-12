import { describe, expect, it } from 'vitest'
import type { Afluencia } from '../../lib/api'
import type { Lugar } from '../../types/contratos'
import { alternativaA, nivelDe, parsearSimulada } from './afluencia'

const lugar = (slug: string, categoria: Lugar['categoria'], lat: number, lng = -96.138): Lugar =>
  ({ slug, categoria, lat, lng }) as Lugar
const af = (slug: string, nivel: Afluencia['nivel']): [string, Afluencia] => [
  slug,
  { slug, nivel, llegadas: 0, capacidad: 30, ocupacion: 0 },
]

const zocalo = lugar('zocalo', 'historia', 19.2)
const cerca = lugar('catedral', 'historia', 19.2015) // ~170 m
const otraCat = lugar('cafe', 'comida', 19.2005) // ~55 m
const lejos = lugar('faro', 'mar', 19.22) // ~2 km

describe('afluencia', () => {
  it('sin dato, un lugar se considera tranquilo', () => {
    expect(nivelDe(new Map(), 'zocalo')).toBe('tranquilo')
  })

  it('ofrece el lugar tranquilo de la misma categoría aunque haya otro más cerca', () => {
    const a = alternativaA(zocalo, [zocalo], [zocalo, cerca, otraCat, lejos], new Map([af('zocalo', 'lleno')]))
    expect(a?.slug).toBe('catedral')
  })

  it('no ofrece lugares llenos, concurridos lejanos ni los que ya están en la ruta', () => {
    const niveles = new Map([af('catedral', 'lleno'), af('cafe', 'tranquilo')])
    expect(alternativaA(zocalo, [zocalo, otraCat], [zocalo, cerca, otraCat, lejos], niveles)).toBeNull()
  })

  it('sin alternativas devuelve null', () => {
    expect(alternativaA(zocalo, [zocalo], [zocalo, lejos], new Map())).toBeNull()
  })

  it('lee los niveles forzados e ignora lo que no entiende', () => {
    const m = parsearSimulada('zocalo:lleno, catedral:concurrido,faro:rojo,:lleno,suelto')
    expect([...m]).toEqual([['zocalo', 'lleno'], ['catedral', 'concurrido']])
    expect(parsearSimulada(null).size).toBe(0)
  })
})
