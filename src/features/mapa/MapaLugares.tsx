// M4 Mapa Mapbox · Dev 2. Lugares del catálogo con su estado en la ruta (diseño 03), eventos en curso,
// posición de usePosition() y tarjeta del lugar elegido.
// `arriba` y `abajo` son capas sobre el mapa (cabecera, flechas del recorrido).
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Map, { Layer, Marker, Source, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Check, TextAa, X } from '@phosphor-icons/react'
import type { Evento, Lugar } from '../../types/contratos'
import { usePosition } from '../geo/usePosition'
import { useRutaCaminable } from '../geo/useRutaCaminable'
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
  /** Paradas de la ruta activa, en orden: se unen con una línea azul por las calles. */
  ruta?: Lugar[]
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
const SIN_RUTA: Lugar[] = []

const CLAVE_NOMBRES = 'jarana.mapa.nombres'
const leerNombres = () => {
  try {
    return sessionStorage.getItem(CLAVE_NOMBRES) === '1'
  } catch {
    return false
  }
}

// Azul de la ruta; el contorno blanco la separa de calles y edificios.
const AZUL_RUTA = '#1446C8'

export default function MapaLugares({
  lugares,
  ruta = SIN_RUTA,
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
  const navegar = useNavigate()
  const linea = useRutaCaminable(ruta)
  // Los textos de comercios y lugares de Mapbox estorban a los pines: apagados salvo que el turista los pida.
  // Los nombres de las calles siempre se ven.
  const [nombres, setNombres] = useState(leerNombres)
  const aplicarNombres = (activos: boolean) => {
    const m = mapa.current?.getMap()
    if (!m) return
    m.setConfigProperty('basemap', 'showPointOfInterestLabels', activos)
    m.setConfigProperty('basemap', 'showPlaceLabels', activos)
    m.setConfigProperty('basemap', 'showRoadLabels', true)
  }
  const alternarNombres = () => {
    const nuevo = !nombres
    setNombres(nuevo)
    aplicarNombres(nuevo)
    try {
      sessionStorage.setItem(CLAVE_NOMBRES, nuevo ? '1' : '0')
    } catch {
      /* sin almacenamiento: vale solo mientras la pantalla esté abierta */
    }
  }

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
        onLoad={() => aplicarNombres(nombres)}
        style={{ width: '100%', height: '100%' }}
      >
        {linea.length > 1 && (
          <Source
            id="ruta"
            type="geojson"
            data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: linea } }}
          >
            {/* slot "middle": sobre calles y edificios, bajo los textos del estilo Standard */}
            <Layer
              id="ruta-contorno"
              type="line"
              slot="middle"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': '#ffffff', 'line-width': 11, 'line-emissive-strength': 1 }}
            />
            <Layer
              id="ruta-linea"
              type="line"
              slot="middle"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': AZUL_RUTA, 'line-width': 6, 'line-emissive-strength': 1 }}
            />
          </Source>
        )}
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
                {(e === 'siguiente' || elegido?.slug === l.slug) && (
                  <span className="marcador-etiqueta">{e === 'siguiente' && etiquetaSiguiente ? etiquetaSiguiente : nombre}</span>
                )}
              </button>
            </Marker>
          )
        })}
        {eventos.map((ev) => (
          <Marker key={ev.slug} latitude={ev.lat} longitude={ev.lng} anchor="bottom">
            <button
              type="button"
              className="marcador marcador--evento"
              aria-label={t('mapa.eventoAhora', { titulo: en ? ev.titulo_en : ev.titulo_es })}
              onClick={onEvento}
            >
              <span className="marcador-circulo">
                <Ilustracion nombre={ev.categoria} tamano={30} />
              </span>
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

      <button
        type="button"
        className="mapa-nombres"
        aria-pressed={nombres}
        aria-label={t('mapa.nombres')}
        title={t('mapa.nombres')}
        onClick={alternarNombres}
      >
        <TextAa size={22} weight="bold" aria-hidden="true" />
      </button>

      <div className="mapa-abajo">
        {elegido && (
          <Tarjeta className="mapa-tarjeta">
            <Boton variante="blanco" className="mapa-cerrar" aria-label={t('mapa.cerrar')} onClick={() => setElegido(null)}>
              <X size={20} weight="bold" />
            </Boton>
            <h2>{en ? elegido.nombre_en : elegido.nombre_es}</h2>
            <p>{en ? elegido.curiosidad_en : elegido.curiosidad_es}</p>
            {/* ¡Llegaste! registra la llegada (con GPS valida los 40 m; en la demo vale) y desde ahí se juega el reto. */}
            <Boton ancho onClick={() => navegar(`/lugar/${elegido.slug}`)}>
              {t('mapa.irAlLugar')}
            </Boton>
          </Tarjeta>
        )}
        {abajo}
      </div>
    </div>
  )
}
