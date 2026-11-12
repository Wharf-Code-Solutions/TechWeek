// Pantalla 01: Preferencias (entrada) · Responsable: Dev 3 (M3 lógica de ruta: Dev 1)
// Diseño 01: hoja blanca con asa, personaje y apodo, tiempo e intereses.
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  APODO_MAX,
  AVATARES,
  INTERESES,
  TIEMPO_MAX,
  TIEMPO_MIN,
  TIEMPO_PASO,
  TIEMPOS_ATAJO,
  cargarPreferencias,
  formatoTiempo,
  guardarPreferencias,
  tieneIntereses,
  type Preferencias as Prefs,
} from '../app/preferencias'
import Banderines from '../components/ui/Banderines'
import Boton from '../components/ui/Boton'
import Ilustracion from '../components/ui/Ilustracion'
import PantallaCarga from '../components/ui/PantallaCarga'
import { esExplorador } from '../features/geo/explorador'
import { esperarPosicion, obtenerGps } from '../features/geo/gpsStore'
import { salidaDeLaRuta } from '../features/geo/posicionManual'
import { guardarOrigen } from '../features/geo/origen'
import { limpiarSaltadas } from '../features/mapa/saltadas'
import PermisoUbicacion from '../features/geo/PermisoUbicacion'
import { api } from '../lib/api'
import type { Categoria, Idioma } from '../types/contratos'
import estilos from './Preferencias.module.css'

/** Cuánto se espera al GPS antes de armar la ruta sin posición (modo explorador o señal débil). */
const ESPERA_GPS_MS = 4000

export default function Preferencias() {
  const { t, i18n } = useTranslation()
  const navegar = useNavigate()
  const [pref, setPref] = useState<Prefs>(cargarPreferencias)
  const [paso, setPaso] = useState<'preferencias' | 'permiso'>('preferencias')
  const [ruta, setRuta] = useState<'inactivo' | 'armando' | 'error'>('inactivo')
  const armando = useRef(false)
  // El aviso de interés obligatorio aparece solo después de intentar continuar.
  const [faltaInteres, setFaltaInteres] = useState(false)

  function cambiarIdioma(idioma: Idioma) {
    setPref((p) => ({ ...p, idioma }))
    void i18n.changeLanguage(idioma)
  }

  function alternarInteres(c: Categoria) {
    setPref((p) => ({
      ...p,
      intereses: p.intereses.includes(c) ? p.intereses.filter((i) => i !== c) : [...p.intereses, c],
    }))
    setFaltaInteres(false)
  }

  // Crea la ruta en el servidor (algoritmo M3 de Dev 1). Sin ruta activa, terminar la ruta da 404.
  async function armarRuta() {
    if (armando.current) return
    armando.current = true
    // El mapa es lo más pesado (mapbox-gl, casi 2 MB): se empieza a bajar ya, mientras se arma la ruta y se ve la carga.
    void import('./Mapa')
    setRuta('armando')
    // La ruta parte de donde está el turista: si el GPS aún no responde se espera un momento.
    // Lejos del Centro (o sin GPS) la ruta sale del Zócalo; la ruta siempre se arma con las preferencias elegidas.
    const sinUbicacion = esExplorador()
    const real = sinUbicacion ? null : await esperarPosicion(ESPERA_GPS_MS)
    const gps = sinUbicacion ? null : salidaDeLaRuta(real, obtenerGps().estado)
    try {
      await api.crearRuta({
        tiempo_min: pref.tiempoMin,
        intereses: pref.intereses,
        ...(gps ? { lat: gps.lat, lng: gps.lng } : {}),
      })
      guardarOrigen(gps)
      limpiarSaltadas()
      navegar('/mapa')
    } catch {
      setRuta('error')
    } finally {
      armando.current = false
    }
  }

  // Referencia estable para que el efecto del permiso no se dispare de nuevo en cada render.
  const armarRef = useRef(armarRuta)
  armarRef.current = armarRuta
  const alListo = useCallback(() => void armarRef.current(), [])

  function continuar() {
    if (!tieneIntereses(pref)) {
      setFaltaInteres(true)
      return
    }
    guardarPreferencias(pref)
    setPaso('permiso')
  }

  const avance = ((pref.tiempoMin - TIEMPO_MIN) / (TIEMPO_MAX - TIEMPO_MIN)) * 100

  return (
    <main className={estilos.pantalla}>
      <Banderines cuerda />
      <div className={estilos.hoja}>
        <span className={estilos.asa} aria-hidden="true" />

        {paso === 'permiso' ? (
          <>
            <h1 className="solo-lectores">{t('pantallas.preferencias')}</h1>
            <PermisoUbicacion onListo={alListo} />
          </>
        ) : (
          <>
            <div className={estilos.encabezado}>
              <span className={estilos.marca}>JARANA</span>
              <div className={estilos.idiomas} role="group" aria-label={t('preferencias.idioma')}>
                {(['es', 'en'] as Idioma[]).map((i) => (
                  <button key={i} type="button" aria-pressed={pref.idioma === i} onClick={() => cambiarIdioma(i)}>
                    {i.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <h1 className={estilos.titulo}>{t('preferencias.bienvenida')}</h1>
            <p className={estilos.bajada}>{t('preferencias.bajada')}</p>

            <fieldset className={estilos.grupo}>
              <legend>{t('preferencias.personaje')}</legend>
              <div className={estilos.personajes}>
                {AVATARES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={estilos.avatar}
                    aria-pressed={pref.personaje === a}
                    onClick={() => setPref((p) => ({ ...p, personaje: a }))}
                  >
                    <Ilustracion nombre={a} tamano={64} />
                    <span>{t(`pasaporte.avatar_${a}`)}</span>
                  </button>
                ))}
              </div>
              <label className={estilos.apodo}>
                <input
                  type="text"
                  value={pref.apodo}
                  maxLength={APODO_MAX}
                  placeholder={t('preferencias.apodo_ejemplo')}
                  aria-label={t('preferencias.apodo')}
                  onChange={(e) => setPref((p) => ({ ...p, apodo: e.target.value }))}
                />
              </label>
            </fieldset>

            <fieldset className={estilos.grupo}>
              <legend>{t('preferencias.tiempo')}</legend>
              <p className={estilos.tiempoValor} aria-live="polite">
                {formatoTiempo(pref.tiempoMin)}
              </p>
              <input
                type="range"
                className={estilos.deslizador}
                min={TIEMPO_MIN}
                max={TIEMPO_MAX}
                step={TIEMPO_PASO}
                value={pref.tiempoMin}
                aria-label={t('preferencias.tiempo')}
                aria-valuetext={formatoTiempo(pref.tiempoMin)}
                style={{ ['--avance' as string]: `${avance}%` }}
                onChange={(e) => setPref((p) => ({ ...p, tiempoMin: Number(e.target.value) }))}
              />
              <div className={estilos.extremos} aria-hidden="true">
                <span>{formatoTiempo(TIEMPO_MIN)}</span>
                <span>{formatoTiempo(TIEMPO_MAX)}</span>
              </div>
              <div className={estilos.atajos}>
                {TIEMPOS_ATAJO.map((min) => (
                  <button
                    key={min}
                    type="button"
                    className={estilos.opcion}
                    aria-pressed={pref.tiempoMin === min}
                    onClick={() => setPref((p) => ({ ...p, tiempoMin: min }))}
                  >
                    {formatoTiempo(min)}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className={estilos.grupo}>
              <legend>{t('preferencias.intereses')}</legend>
              <div className={`${estilos.intereses}${faltaInteres ? ` ${estilos.interesesError}` : ''}`}>
                {INTERESES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={estilos.interes}
                    aria-pressed={pref.intereses.includes(c)}
                    onClick={() => alternarInteres(c)}
                  >
                    <Ilustracion nombre={c} tamano={40} />
                    {t(`preferencias.categorias.${c}`)}
                  </button>
                ))}
              </div>
            </fieldset>

            {faltaInteres && (
              <p className={estilos.error} role="alert">
                {t('preferencias.elige_interes')}
              </p>
            )}
            <Boton ancho disabled={ruta === 'armando'} onClick={continuar}>
              {t('preferencias.continuar')}
            </Boton>
          </>
        )}

        {ruta === 'armando' && <PantallaCarga />}
        {ruta === 'error' && (
          <>
            <p role="alert">{t('preferencias.error_ruta')}</p>
            <Boton ancho variante="amarillo" onClick={() => void armarRuta()}>
              {t('preferencias.reintentar')}
            </Boton>
          </>
        )}
      </div>
    </main>
  )
}
