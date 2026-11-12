import { useTranslation } from 'react-i18next'
import type { Idioma } from '../types/contratos'

/** Idioma activo de la app (es, en o fr). */
export const idiomaDe = (lng: string): Idioma => (lng.startsWith('fr') ? 'fr' : lng.startsWith('en') ? 'en' : 'es')

/** Orden en que se busca un texto: el francés que falte cae al inglés, y el inglés al español. */
export const RESPALDO: Record<Idioma, Idioma[]> = { es: ['es'], en: ['en', 'es'], fr: ['fr', 'en', 'es'] }

/** Lee `base_<idioma>` con respaldo (campo(lugar, 'nombre') → nombre_fr, nombre_en o nombre_es). */
export function leerCampo(objeto: object, base: string, idioma: Idioma): string {
  const o = objeto as Record<string, unknown>
  for (const i of RESPALDO[idioma]) {
    const v = o[`${base}_${i}`]
    if (typeof v === 'string' && v) return v
  }
  return ''
}

/** Devuelve el campo en el idioma activo, con respaldo si aún no está traducido. */
export function useCampo() {
  const { i18n } = useTranslation()
  const idioma = idiomaDe(i18n.language)
  return (objeto: object, base: string): string => leerCampo(objeto, base, idioma)
}
