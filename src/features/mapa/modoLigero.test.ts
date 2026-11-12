import { beforeEach, describe, expect, it } from 'vitest'
import { activarLigeroAuto, equipoModesto, esLigero, fijarLigero, fpsPromedio, reiniciarLigero } from './modoLigero'

const nav = (extra: object) => ({ hardwareConcurrency: 8, ...extra }) as unknown as Navigator

describe('equipoModesto', () => {
  it('detecta poca memoria, pocos núcleos, ahorro de datos y red lenta', () => {
    expect(equipoModesto(nav({ deviceMemory: 2 }))).toBe(true)
    expect(equipoModesto(nav({ hardwareConcurrency: 4 }))).toBe(true)
    expect(equipoModesto(nav({ connection: { saveData: true } }))).toBe(true)
    expect(equipoModesto(nav({ connection: { effectiveType: '3g' } }))).toBe(true)
  })
  it('un equipo potente no es modesto', () => {
    expect(equipoModesto(nav({ deviceMemory: 8, connection: { effectiveType: '4g' } }))).toBe(false)
  })
})

describe('fpsPromedio', () => {
  it('convierte ms entre cuadros en fps', () => {
    expect(fpsPromedio([50, 50])).toBe(20)
    expect(fpsPromedio([])).toBeNull()
  })
})

describe('modo ligero', () => {
  beforeEach(() => {
    reiniciarLigero()
  })
  it('la medición lo activa, pero la elección manual manda', () => {
    activarLigeroAuto()
    expect(esLigero()).toBe(true)
    fijarLigero(false)
    expect(esLigero()).toBe(false)
    activarLigeroAuto()
    expect(esLigero()).toBe(false)
  })
})
