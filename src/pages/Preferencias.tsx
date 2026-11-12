// Pantalla 01: Preferencias (entrada) · Responsable: Dev 3 (M3 lógica de ruta: Dev 1)
import { useState } from 'react'
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
import PermisoUbicacion from '../features/geo/PermisoUbicacion'
import type { Categoria, Idioma } from '../types/contratos'
import estilos from './Preferencias.module.css'

export default function Preferencias() {
  const { t, i18n } = useTranslation()
  const navegar = useNavigate()
  const [pref, setPref] = useState<Prefs>(cargarPreferencias)
  const [paso, setPaso] = useState<'preferencias' | 'permiso'>('preferencias')

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

  function continuar() {
    guardarPreferencias(pref)
    if (esModoDemo()) {
      activarExplorador(false)
      navegar('/mapa')
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
          <PermisoUbicacion onListo={() => navegar('/mapa')} />
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

            <Boton ancho onClick={continuar}>
              {t('preferencias.continuar')}
            </Boton>
          </>
        )}
      </div>
    </main>
  )
}
