import { describe, expect, it } from 'vitest'
import { VALIDEZ_MIN, vigente } from '../features/cartera/cuponGuardado'
import { PREFERENCIAS_INICIALES, normalizar } from './preferencias'

describe('normalizar preferencias', () => {
  it('usa los valores iniciales si lo guardado es basura', () => {
    expect(normalizar(null)).toEqual(PREFERENCIAS_INICIALES)
    expect(normalizar('x')).toEqual(PREFERENCIAS_INICIALES)
  })

  it('descarta idioma, tiempo e intereses inválidos', () => {
    const p = normalizar({ idioma: 'fr', tiempoMin: 7, intereses: ['mar', 'pizza', 42] })
    expect(p).toEqual({ idioma: 'es', tiempoMin: 60, intereses: ['mar'] })
  })

  it('conserva preferencias válidas', () => {
    const p = { idioma: 'en', tiempoMin: 120, intereses: ['historia', 'comida'] }
    expect(normalizar(p)).toEqual(p)
  })
})

describe('cupón guardado', () => {
  const ahora = 1_000_000_000_000
  it('es vigente durante la ventana de validez', () => {
    expect(vigente({ codigo: 'A', en: ahora - 60_000 }, ahora)).toBe(true)
  })
  it('caduca pasada la validez y rechaza fechas futuras o vacías', () => {
    expect(vigente({ codigo: 'A', en: ahora - (VALIDEZ_MIN * 60_000 + 1) }, ahora)).toBe(false)
    expect(vigente({ codigo: 'A', en: ahora + 5_000 }, ahora)).toBe(false)
    expect(vigente(null, ahora)).toBe(false)
  })
})
