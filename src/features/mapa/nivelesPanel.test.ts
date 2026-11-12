import { describe, expect, it } from 'vitest'
import { ALTO_PLEGADO, altoNivel, bajarNivel, subirNivel } from './nivelesPanel'

describe('niveles del panel', () => {
  it('sube y baja de un nivel en un nivel y se detiene en los extremos', () => {
    expect(subirNivel('plegado')).toBe('medio')
    expect(subirNivel('medio')).toBe('completo')
    expect(subirNivel('completo')).toBe('completo')
    expect(bajarNivel('completo')).toBe('medio')
    expect(bajarNivel('medio')).toBe('plegado')
    expect(bajarNivel('plegado')).toBe('plegado')
  })

  it('cada nivel es más alto que el anterior en un celular', () => {
    const pantalla = 812
    expect(altoNivel('plegado', pantalla)).toBe(ALTO_PLEGADO)
    expect(altoNivel('medio', pantalla)).toBeGreaterThan(altoNivel('plegado', pantalla))
    expect(altoNivel('completo', pantalla)).toBeGreaterThan(altoNivel('medio', pantalla))
  })

  it('el panel completo casi llena la pantalla pero deja un margen', () => {
    expect(altoNivel('completo', 800)).toBeLessThan(800)
    expect(altoNivel('completo', 800)).toBeGreaterThan(780)
  })

  it('en pantallas muy bajas nunca es menor que el plegado', () => {
    expect(altoNivel('completo', 60)).toBe(ALTO_PLEGADO)
  })
})
