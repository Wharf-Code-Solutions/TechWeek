// M4 Mapa Mapbox · Dev 2. Lugares del catálogo, posición de usePosition() y tarjeta del lugar elegido.
// `arriba` y `abajo` son capas sobre el mapa (flechas del recorrido, botón del panel).
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Map, { Layer, Marker, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { X } from '@phosphor-icons/react'
import type { Lugar } from '../../types/contratos'
import { usePosition } from '../geo/usePosition'
import Ilustracion from '../../components/ui/Ilustracion'
import Tarjeta from '../../components/ui/Tarjeta'
import Boton from '../../components/ui/Boton'
import './mapa.css'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
// Cámara limitada al Centro Histórico del puerto (regla de contratos §1). Con margen:
// inclinada en 3D la vista alcanza más lejos y un límite justo empuja el centro a un lado.
const LIMITES: [[number, number], [number, number]] = [[-96.16, 19.18], [-96.115, 19.22]]

/** Vista inicial: sobre el turista si hay posición; si no, encuadrando todos los lugares. */
function vistaInicial(pos: { lat: number; lng: number } | null, lugares: Lugar[]) {
  const comun = { pitch: 55, fitBoundsOptions: { padding: 60 } }
  if (pos) return { ...comun, latitude: pos.lat, longitude: pos.lng, zoom: 16.5 }
  if (!lugares.length) return { ...comun, latitude: 19.1995, longitude: -96.138, zoom: 16 }
  const lats = lugares.map((l) => l.lat)
  const lngs = lugares.map((l) => l.lng)
  return {
    ...comun,
    bounds: [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ] as [[number, number], [number, number]],
  }
}

interface Props {
  lugares: Lugar[]
  arriba?: ReactNode
  abajo?: ReactNode
}

export default function MapaLugares({ lugares, arriba, abajo }: Props) {
  const { t, i18n } = useTranslation()
  const en = i18n.language === 'en'
  const pos = usePosition()
  const [elegido, setElegido] = useState<Lugar | null>(null)
  const mapa = useRef<MapRef>(null)
  // Primera capa de etiquetas: los edificios 3D van debajo para no tapar nombres de calles.
  const [antesDe, setAntesDe] = useState<string | undefined>()

  // En el recorrido virtual la cámara sigue al turista; con GPS se deja mover libre.
  const demo = pos?.fuente === 'demo'
  useEffect(() => {
    if (demo && pos) mapa.current?.easeTo({ center: [pos.lng, pos.lat], duration: 400 })
  }, [demo, pos])

  if (!TOKEN) return <p className="mapa-aviso">{t('mapa.sinToken')}</p>

  return (
    <div className="mapa">
      <Map
        ref={mapa}
        mapboxAccessToken={TOKEN}
        initialViewState={vistaInicial(pos, lugares)}
        maxBounds={LIMITES}
        maxPitch={70}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        onLoad={(e) => setAntesDe(e.target.getStyle()?.layers?.find((c) => c.type === 'symbol')?.id)}
      >
        {antesDe && (
          <Layer
            id="edificios-3d"
            type="fill-extrusion"
            source="composite"
            source-layer="building"
            filter={['==', 'extrude', 'true']}
            minzoom={14}
            beforeId={antesDe}
            paint={{
              'fill-extrusion-color': '#DCD6EC',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.85,
            }}
          />
        )}
        {lugares.map((l) => (
          <Marker key={l.slug} latitude={l.lat} longitude={l.lng} anchor="bottom">
            <button
              type="button"
              className="mapa-marcador"
              aria-label={en ? l.nombre_en : l.nombre_es}
              aria-pressed={elegido?.slug === l.slug}
              onClick={() => setElegido(l)}
            >
              <Ilustracion nombre={l.ilustracion} tamano={48} />
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
