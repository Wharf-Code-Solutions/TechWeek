// M4 Mapa Mapbox · Dev 2. Lugares del catálogo con su estado en la ruta (diseño 03), eventos en curso,
// posición de usePosition() y tarjeta del lugar elegido.
// `arriba` y `abajo` son capas sobre el mapa (cabecera, flechas del recorrido).
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Map, { Marker, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Check, X } from '@phosphor-icons/react'
import type { Evento, Lugar } from '../../types/contratos'
import { usePosition } from '../geo/usePosition'
import Ilustracion from '../../components/ui/Ilustracion'
import Tarjeta from '../../components/ui/Tarjeta'
import Boton from '../../components/ui/Boton'
import './mapa.css'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
// Todo el Centro Histórico del puerto (contratos §1), del Parque Zamora al norte del Faro y
// del malecón a la avenida 5 de Mayo. Junto con ZOOM_MIN evita descargar el resto de la ciudad.
// shortcut: perímetro aproximado; ajustarlo si Dev 1 o el cronista dan el límite oficial.
const LIMITES: [[number, number], [number, number]] = [[-96.148, 19.188], [-96.126, 19.209]]
// Abre en ZOOM y solo deja alejar un poco (hasta ZOOM_MIN); acercar no tiene límite.
const ZOOM = 17
const ZOOM_MIN = 16.6
// El Zócalo, corazón del Centro Histórico: aquí empieza el mapa.
const ZOCALO = { lat: 19.20023, lng: -96.13853 }

/** Siempre empieza en el Zócalo; en el recorrido demo la cámara luego sigue al turista. */
function vistaInicial(lugares: Lugar[]) {
  const zocalo = lugares.find((l) => l.slug === 'zocalo') ?? ZOCALO
  return { latitude: zocalo.lat, longitude: zocalo.lng, zoom: ZOOM, pitch: 55 }
}

type Estado = 'hecho' | 'siguiente' | 'ruta' | 'fuera'

interface Props {
  lugares: Lugar[]
  /** Slugs de la ruta activa; vacío = sin ruta (todos se ven igual). */
  enRuta?: ReadonlySet<string>
  /** Slugs con reto completado. */
  hechos?: ReadonlySet<string>
  siguiente?: string | null
  /** Texto bajo la siguiente parada ("Siguiente · 120 m"). */
  etiquetaSiguiente?: string
  /** Eventos en curso: se marcan en el mapa. */
  eventos?: Evento[]
  onEvento?: () => void
  /** Alto (px) de lo que tapa la parte baja del mapa (panel): la cámara centra sobre lo que queda a la vista. */
  padAbajo?: number
  arriba?: ReactNode
  abajo?: ReactNode
}

const VACIO: ReadonlySet<string> = new Set()

export default function MapaLugares({
  lugares,
  enRuta = VACIO,
  hechos = VACIO,
  siguiente = null,
  etiquetaSiguiente,
  eventos = [],
  onEvento,
  padAbajo = 0,
  arriba,
  abajo,
}: Props) {
  const { t, i18n } = useTranslation()
  const en = i18n.language === 'en'
  const pos = usePosition()
  const [elegido, setElegido] = useState<Lugar | null>(null)
  const mapa = useRef<MapRef>(null)

  // En el recorrido virtual la cámara sigue al turista; con GPS se deja mover libre.
  const demo = pos?.fuente === 'demo'
  useEffect(() => {
    if (demo && pos) mapa.current?.easeTo({ center: [pos.lng, pos.lat], duration: 400 })
  }, [demo, pos])

  // El mapa ocupa toda la pantalla (sin redimensionar el lienzo); al plegar o abrir el panel solo se mueve el centro.
  useEffect(() => {
    mapa.current?.easeTo({ padding: { top: 0, left: 0, right: 0, bottom: padAbajo }, duration: 250 })
  }, [padAbajo])

  const estado = (slug: string): Estado =>
    hechos.has(slug) ? 'hecho' : slug === siguiente ? 'siguiente' : enRuta.size === 0 || enRuta.has(slug) ? 'ruta' : 'fuera'

  if (!TOKEN) return <p className="mapa-aviso">{t('mapa.sinToken')}</p>

  return (
    <div className="mapa">
      <Map
        ref={mapa}
        mapboxAccessToken={TOKEN}
        initialViewState={{ ...vistaInicial(lugares), padding: { top: 0, left: 0, right: 0, bottom: padAbajo } }}
        maxBounds={LIMITES}
        minZoom={ZOOM_MIN}
        maxPitch={60}
        // Standard trae edificios 3D con luz y sombras, y modelos de monumentos donde Mapbox los tiene.
        mapStyle="mapbox://styles/mapbox/standard"
        style={{ width: '100%', height: '100%' }}
      >
        {lugares.map((l) => {
          const e = estado(l.slug)
          const nombre = en ? l.nombre_en : l.nombre_es
          return (
            <Marker key={l.slug} latitude={l.lat} longitude={l.lng} anchor="bottom" style={{ zIndex: e === 'siguiente' ? 2 : 1 }}>
              <button
                type="button"
                className={`marcador marcador--${e}`}
                aria-label={e === 'ruta' || e === 'fuera' ? nombre : t(`mapa.estado_${e}`, { nombre })}
                aria-pressed={elegido?.slug === l.slug}
                onClick={() => setElegido(l)}
              >
                <span className="marcador-circulo">
                  {e === 'hecho' ? (
                    <Check size={24} weight="bold" color="#fff" aria-hidden="true" />
                  ) : (
                    <Ilustracion nombre={l.ilustracion} tamano={e === 'siguiente' ? 32 : 28} />
                  )}
                </span>
                <span className="marcador-etiqueta">{e === 'siguiente' && etiquetaSiguiente ? etiquetaSiguiente : nombre}</span>
              </button>
            </Marker>
          )
        })}
        {eventos.map((ev) => (
          <Marker key={ev.slug} latitude={ev.lat} longitude={ev.lng} anchor="bottom">
            <button type="button" className="marcador marcador--evento" onClick={onEvento}>
              <span className="marcador-circulo">
                <Ilustracion nombre={ev.categoria} tamano={30} />
              </span>
              <span className="marcador-etiqueta">{t('mapa.eventoAhora', { titulo: en ? ev.titulo_en : ev.titulo_es })}</span>
            </button>
          </Marker>
        ))}
        {pos && (
          <Marker latitude={pos.lat} longitude={pos.lng}>
            <span className="mapa-yo" role="img" aria-label={t('mapa.tuPosicion')} />
          </Marker>
        )}
      </Map>

      {arriba && <div className="mapa-arriba">{arriba}</div>}

      <div className="mapa-abajo">
        {elegido && (
          <Tarjeta className="mapa-tarjeta">
            <Boton variante="blanco" className="mapa-cerrar" aria-label={t('mapa.cerrar')} onClick={() => setElegido(null)}>
              <X size={20} weight="bold" />
            </Boton>
            <h2>{en ? elegido.nombre_en : elegido.nombre_es}</h2>
            <p>{en ? elegido.curiosidad_en : elegido.curiosidad_es}</p>
          </Tarjeta>
        )}
        {abajo}
      </div>
    </div>
  )
}
