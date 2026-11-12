import { describe, expect, it } from 'vitest'
import { VALIDEZ_MIN, vigente } from '../features/cartera/cuponGuardado'
import {
  PREFERENCIAS_INICIALES,
  TIEMPO_MAX,
  TIEMPO_MIN,
  TIEMPO_PASO,
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
  it('va de 30 en 30 minutos hasta un máximo de 5 horas', () => {
    expect(TIEMPO_MIN).toBe(30)
    expect(TIEMPO_PASO).toBe(30)
    expect(TIEMPO_MAX).toBe(300)
  })
  it('redondea a pasos de 30 min y limita al rango', () => {
    expect(ajustarTiempo(44)).toBe(30)
    expect(ajustarTiempo(46)).toBe(60)
    expect(ajustarTiempo(100)).toBe(90)
    expect(ajustarTiempo(5)).toBe(TIEMPO_MIN)
    expect(ajustarTiempo(480)).toBe(TIEMPO_MAX)
  })
  it('normalizar corrige tiempos viejos y inválidos', () => {
    expect(normalizar({ tiempoMin: 150 }).tiempoMin).toBe(150)
    expect(normalizar({ tiempoMin: 480 }).tiempoMin).toBe(TIEMPO_MAX)
    expect(normalizar({ tiempoMin: Number.NaN }).tiempoMin).toBe(PREFERENCIAS_INICIALES.tiempoMin)
  })
  it('formatea horas y minutos', () => {
    expect(formatoTiempo(30)).toBe('30 min')
    expect(formatoTiempo(120)).toBe('2 h')
    expect(formatoTiempo(150)).toBe('2 h 30 min')
    expect(formatoTiempo(300)).toBe('5 h')
  })
})

describe('intereses obligatorios', () => {
  it('sin intereses no es válida; con uno sí', () => {
    expect(tieneIntereses({ intereses: [] })).toBe(false)
    expect(tieneIntereses({ intereses: ['mar'] })).toBe(true)
  })
})
