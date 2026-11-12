import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from '../locales/es.json'
import en from '../locales/en.json'
import { cargarPreferencias } from '../app/preferencias'

// Arranca en el idioma que el turista eligió (guardado en el celular), así no vuelve al español al recargar.
const idiomaGuardado = cargarPreferencias().idioma

i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: idiomaGuardado,
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
})

// <html lang> sigue al idioma activo (lectores de pantalla y traductor del navegador).
const marcarIdioma = (lng: string) => document.documentElement.setAttribute('lang', lng)
marcarIdioma(i18n.language)
i18n.on('languageChanged', marcarIdioma)

export default i18n
