// Pantalla 01: Preferencias (entrada) · Responsable: Dev 3 (M3 lógica de ruta: Dev 1)
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  INTERESES,
  TIEMPOS_MIN,
  cargarPreferencias,
  guardarPreferencias,
  type Preferencias as Prefs,
} from '../app/preferencias'
import Banderines from '../components/ui/Banderines'
import Boton from '../components/ui/Boton'
import Tarjeta from '../components/ui/Tarjeta'
import { activarExplorador } from '../features/geo/explorador'
import { esModoDemo } from '../features/geo/demoStore'
import { obtenerGps } from '../features/geo/gpsStore'
import PermisoUbicacion from '../features/geo/PermisoUbicacion'
import { api } from '../lib/api'
import type { Categoria, Idioma } from '../types/contratos'
import estilos from './Preferencias.module.css'

export default function Preferencias() {
  const { t, i18n } = useTranslation()
  const navegar = useNavigate()
  const [pref, setPref] = useState<Prefs>(cargarPreferencias)
  const [paso, setPaso] = useState<'preferencias' | 'permiso'>('preferencias')
  const [ruta, setRuta] = useState<'inactivo' | 'armando' | 'error'>('inactivo')
  const armando = useRef(false)

  function cambiarIdioma(idioma: Idioma) {
    setPref((p) => ({ ...p, idioma }))
    void i18n.changeLanguage(idioma)
  }

  function alternarInteres(c: Categoria) {
    setPref((p) => ({
      ...p,
      intereses: p.intereses.includes(c) ? p.intereses.filter((i) => i !== c) : [...p.intereses, c],
    }))
  }

  // Crea la ruta en el servidor (algoritmo M3 de Dev 1). Sin ruta activa, terminar la ruta da 404.
  async function armarRuta() {
    if (armando.current) return
    armando.current = true
    setRuta('armando')
    const demo = esModoDemo()
    const gps = demo ? null : obtenerGps().posicion
    try {
      await api.crearRuta({
        tiempo_min: pref.tiempoMin,
        intereses: pref.intereses,
        demo,
        ...(gps ? { lat: gps.lat, lng: gps.lng } : {}),
      })
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
    guardarPreferencias(pref)
    if (esModoDemo()) {
      activarExplorador(false)
      void armarRuta()
    } else {
      setPaso('permiso')
    }
  }

  return (
    <main className={estilos.pantalla}>
      <Banderines cuerda />
      <div className={estilos.contenido}>
        <h1 className={estilos.titulo}>{t('pantallas.preferencias')}</h1>

        {paso === 'permiso' ? (
          <PermisoUbicacion onListo={alListo} />
        ) : (
          <>
            <Tarjeta>
              <fieldset className={estilos.grupo}>
                <legend>{t('preferencias.idioma')}</legend>
                <div className={estilos.fila}>
                  {(['es', 'en'] as Idioma[]).map((i) => (
                    <button
                      key={i}
                      type="button"
                      className={estilos.opcion}
                      aria-pressed={pref.idioma === i}
                      onClick={() => cambiarIdioma(i)}
                    >
                      {i.toUpperCase()}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className={estilos.grupo}>
                <legend>{t('preferencias.tiempo')}</legend>
                <div className={estilos.fila}>
                  {TIEMPOS_MIN.map((min) => (
                    <button
                      key={min}
                      type="button"
                      className={estilos.opcion}
                      aria-pressed={pref.tiempoMin === min}
                      onClick={() => setPref((p) => ({ ...p, tiempoMin: min }))}
                    >
                      {t(`preferencias.tiempos.t${min}`)}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className={estilos.grupo}>
                <legend>{t('preferencias.intereses')}</legend>
                <div className={estilos.fila}>
                  {INTERESES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={estilos.opcion}
                      aria-pressed={pref.intereses.includes(c)}
                      onClick={() => alternarInteres(c)}
                    >
                      {t(`preferencias.categorias.${c}`)}
                    </button>
                  ))}
                </div>
              </fieldset>
            </Tarjeta>

            <Boton ancho disabled={ruta === 'armando'} onClick={continuar}>
              {t('preferencias.continuar')}
            </Boton>
          </>
        )}

        {ruta === 'armando' && <p role="status">{t('preferencias.armando')}</p>}
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
