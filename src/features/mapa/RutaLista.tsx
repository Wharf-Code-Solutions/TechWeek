// M7 · Pestaña Ruta del panel (diseño 03): paradas con su estado, saltar la siguiente,
// "Me queda poco tiempo" (recortar) y "Terminar ruta". Ajustar usa PATCH /api/rutas/actual.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Check, FlagCheckered, Scissors, SkipForward } from '@phosphor-icons/react'
import { useCampo } from '../../app/idioma'
import { api } from '../../lib/api'
import type { Lugar } from '../../types/contratos'
import { distanciaM } from '../geo/distancia'
import type { Posicion } from '../geo/usePosition'
import { formatoDistancia, minutosCaminando, recortarRuta } from './progreso'
import './mapa.css'

interface Props {
  ruta: Lugar[] | null | undefined
  /** Slug → doblones ganados en el reto. */
  hechos: ReadonlyMap<string, number>
  siguiente: Lugar | null
  pos: Posicion | null
  onCambio: (lugares: Lugar[]) => void
  /** Paradas saltadas: se quedan en la lista, marcadas, en vez de desaparecer. */
  saltadas: ReadonlySet<string>
  onSaltar: (slug: string) => void
  /** Tocar un lugar de la lista: el mapa lo muestra (el turista no sale del mapa). */
  onEnfocar: (lugar: Lugar) => void
}

export default function RutaLista({ ruta, hechos, saltadas, onSaltar, siguiente, pos, onCambio, onEnfocar }: Props) {
  const { t } = useTranslation()
  const campo = useCampo()
  const navegar = useNavigate()
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState(false)
  const [confirmarRecorte, setConfirmarRecorte] = useState(false)

  if (ruta === undefined) return <p role="status">{t('comun.cargando')}</p>
  if (!ruta) {
    return (
      <div className="ruta">
        <p className="ruta-aviso">{t('ruta.sinRuta')}</p>
        <button type="button" className="ruta-accion" onClick={() => navegar('/')}>
          {t('ruta.armar')}
        </button>
      </div>
    )
  }

  const pendientes = ruta.filter((l) => !hechos.has(l.slug) && !saltadas.has(l.slug))
  const categoria = (l: Lugar) => t(`preferencias.categorias.${l.categoria}`)

  async function ajustar(slugs: string[]) {
    setOcupado(true)
    setError(false)
    try {
      onCambio((await api.ajustarRuta(slugs)).lugares)
      setConfirmarRecorte(false)
    } catch {
      setError(true)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="ruta">
      <ol className="ruta-lista">
        {ruta.map((l, i) => {
          const tlacos = hechos.get(l.slug)
          const nombre = campo(l, 'nombre')
          if (tlacos !== undefined) {
            return (
              <li key={l.slug} className="ruta-fila ruta-fila--hecha">
                <button type="button" className="ruta-fila-boton" aria-label={t('ruta.verEnMapa', { nombre })} onClick={() => onEnfocar(l)}>
                  <span className="ruta-num">
                    <Check size={18} weight="bold" color="#fff" aria-label={t('ruta.hecha')} />
                  </span>
                  <span className="ruta-texto">
                    <strong>{nombre}</strong>
                  </span>
                  <span className="ruta-premio">+{tlacos}</span>
                </button>
              </li>
            )
          }
          if (saltadas.has(l.slug)) {
            return (
              <li key={l.slug} className="ruta-fila ruta-fila--saltada">
                <button type="button" className="ruta-fila-boton" aria-label={t('ruta.verEnMapa', { nombre })} onClick={() => onEnfocar(l)}>
                  <span className="ruta-num">
                    <SkipForward size={16} weight="bold" aria-label={t('ruta.saltada')} />
                  </span>
                  <span className="ruta-texto">
                    <strong>{nombre}</strong>
                    <span className="ruta-sub">{t('ruta.saltada')}</span>
                  </span>
                </button>
              </li>
            )
          }
          const metros = pos ? distanciaM(pos, l) : null
          const esSiguiente = l.slug === siguiente?.slug
          return (
            <li key={l.slug} className={`ruta-fila${esSiguiente ? ' ruta-fila--siguiente' : ''}`}>
              <button type="button" className="ruta-fila-boton" aria-label={t('ruta.verEnMapa', { nombre })} onClick={() => onEnfocar(l)}>
                <span className="ruta-num">{i + 1}</span>
                <span className="ruta-texto">
                  <strong>{nombre}</strong>
                  <span className="ruta-sub">
                    {metros === null
                      ? categoria(l)
                      : esSiguiente
                        ? t('ruta.subSiguiente', { categoria: categoria(l), dist: formatoDistancia(metros), min: minutosCaminando(metros) })
                        : t('ruta.sub', { categoria: categoria(l), dist: formatoDistancia(metros) })}
                  </span>
                </span>
              </button>
              {esSiguiente && pendientes.length > 1 && (
                <button
                  type="button"
                  className="ruta-saltar"
                  aria-label={t('ruta.saltarLugar', { nombre })}
                  disabled={ocupado}
                  // Saltar ya no la quita de la ruta: se queda en la lista marcada y la siguiente pasa a la que sigue.
                  onClick={() => onSaltar(l.slug)}
                >
                  <SkipForward size={18} weight="duotone" aria-hidden="true" />
                </button>
              )}
            </li>
          )
        })}
      </ol>

      {error && (
        <p className="ruta-aviso" role="alert">
          {t('ruta.error_saltar')}
        </p>
      )}

      {confirmarRecorte ? (
        <div className="ruta-acciones" role="group" aria-label={t('ruta.confirmarRecorte')}>
          <p className="ruta-aviso" style={{ gridColumn: '1 / -1' }}>
            {t('ruta.confirmarRecorte')}
          </p>
          <button
            type="button"
            className="ruta-accion"
            disabled={ocupado}
            onClick={() => void ajustar(recortarRuta(ruta, new Set([...hechos.keys(), ...saltadas])))}
          >
            {t('ruta.siRecortar')}
          </button>
          <button type="button" className="ruta-accion ruta-accion--terminar" onClick={() => setConfirmarRecorte(false)}>
            {t('ruta.cancelar')}
          </button>
        </div>
      ) : (
        <div className="ruta-acciones">
          <button
            type="button"
            className="ruta-accion"
            disabled={pendientes.length <= 2 || ocupado}
            onClick={() => setConfirmarRecorte(true)}
          >
            <Scissors size={18} weight="duotone" aria-hidden="true" />
            {t('ruta.pocoTiempo')}
          </button>
          <button type="button" className="ruta-accion ruta-accion--terminar" onClick={() => navegar('/fin')}>
            <FlagCheckered size={18} weight="duotone" aria-hidden="true" />
            {t('mapa.terminar')}
          </button>
        </div>
      )}
    </div>
  )
}
