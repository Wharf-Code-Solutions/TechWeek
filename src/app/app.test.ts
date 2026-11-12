import { describe, expect, it } from 'vitest'
import { VALIDEZ_MIN, vigente } from '../features/cartera/cuponGuardado'
import {
  PREFERENCIAS_INICIALES,
  TIEMPO_MAX,
  TIEMPO_MIN,
  ajustarTiempo,
  formatoTiempo,
  normalizar,
  tieneIntereses,
} from './preferencias'

describe('normalizar preferencias', () => {
  it('usa los valores iniciales si lo guardado es basura', () => {
    expect(normalizar(null)).toEqual(PREFERENCIAS_INICIALES)
    expect(normalizar('x')).toEqual(PREFERENCIAS_INICIALES)
  })

  it('descarta idioma, tiempo e intereses inválidos', () => {
    const p = normalizar({ idioma: 'fr', tiempoMin: 'mucho', intereses: ['mar', 'pizza', 42] })
    expect(p).toEqual({ ...PREFERENCIAS_INICIALES, intereses: ['mar'] })
  })

  it('conserva preferencias válidas', () => {
    const p = {
      idioma: 'en',
      tiempoMin: 120,
      intereses: ['historia', 'comida'],
      personaje: 'avatar-sombrero',
      apodo: 'Lupe',
    }
    expect(normalizar(p)).toEqual(p)
  })

  it('valida personaje y apodo', () => {
    const p = normalizar({ personaje: 'avatar-gorra', apodo: `  ${'x'.repeat(40)}  ` })
    expect(p.personaje).toBe('avatar-flor')
    expect(p.apodo).toBe('x'.repeat(20))
    expect(normalizar({ apodo: 7 }).apodo).toBe('')
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

describe('tiempo disponible', () => {
  it('redondea a pasos de 15 min y limita al rango', () => {
    expect(ajustarTiempo(52)).toBe(45)
    expect(ajustarTiempo(53)).toBe(60)
    expect(ajustarTiempo(97)).toBe(90)
    expect(ajustarTiempo(98)).toBe(105)
    expect(ajustarTiempo(5)).toBe(TIEMPO_MIN)
    expect(ajustarTiempo(9999)).toBe(TIEMPO_MAX)
  })
  it('normalizar acepta cualquier tiempo válido y corrige el resto', () => {
    expect(normalizar({ tiempoMin: 135 }).tiempoMin).toBe(135)
    expect(normalizar({ tiempoMin: 7 }).tiempoMin).toBe(TIEMPO_MIN)
    expect(normalizar({ tiempoMin: Number.NaN }).tiempoMin).toBe(PREFERENCIAS_INICIALES.tiempoMin)
  })
  it('formatea horas y minutos', () => {
    expect(formatoTiempo(30)).toBe('30 min')
    expect(formatoTiempo(120)).toBe('2 h')
    expect(formatoTiempo(135)).toBe('2 h 15 min')
    expect(formatoTiempo(480)).toBe('8 h')
  })
})

describe('intereses obligatorios', () => {
  it('sin intereses no es válida; con uno sí', () => {
    expect(tieneIntereses({ intereses: [] })).toBe(false)
    expect(tieneIntereses({ intereses: ['mar'] })).toBe(true)
  })
})
