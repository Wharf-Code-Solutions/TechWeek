import { useTranslation } from 'react-i18next'

/** Devuelve el campo en el idioma activo: campo(lugar, 'nombre') lee nombre_es o nombre_en. */
export function useCampo() {
  const { i18n } = useTranslation()
  const sufijo = i18n.language.startsWith('en') ? 'en' : 'es'
  return (objeto: object, base: string): string =>
    (objeto as Record<string, string>)[`${base}_${sufijo}`] ?? ''
}
