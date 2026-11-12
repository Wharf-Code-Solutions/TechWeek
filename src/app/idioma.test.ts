import { describe, expect, it } from 'vitest'
import { contenidoEn, idiomaDelReto } from '../features/retos/logica'
import { idiomaDe, leerCampo } from './idioma'

const lugar = { nombre_es: 'Faro', nombre_en: 'Lighthouse', nombre_fr: 'Phare', curiosidad_es: 'Dato', curiosidad_en: 'Fact' }

describe('idioma', () => {
  it('reconoce el idioma activo', () => {
    expect(idiomaDe('fr')).toBe('fr')
    expect(idiomaDe('fr-FR')).toBe('fr')
    expect(idiomaDe('en-US')).toBe('en')
    expect(idiomaDe('es')).toBe('es')
  })

  it('lee el campo en francés y, si falta, cae al inglés y luego al español', () => {
    expect(leerCampo(lugar, 'nombre', 'fr')).toBe('Phare')
    expect(leerCampo(lugar, 'curiosidad', 'fr')).toBe('Fact')
    expect(leerCampo({ titulo_es: 'Hola' }, 'titulo', 'fr')).toBe('Hola')
    expect(leerCampo(lugar, 'nombre', 'es')).toBe('Faro')
  })

  it('un reto sin francés se juega en inglés', () => {
    expect(idiomaDelReto({ contenido_fr: null }, 'fr')).toBe('en')
    expect(idiomaDelReto({ contenido_fr: undefined }, 'fr')).toBe('en')
    expect(contenidoEn('es', 'en', null, 'fr')).toBe('en')
    expect(contenidoEn('es', 'en', 'fr', 'fr')).toBe('fr')
    expect(contenidoEn('es', 'en', 'fr', 'es')).toBe('es')
  })
})
