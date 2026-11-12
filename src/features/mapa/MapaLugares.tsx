// M4 Mapa Mapbox · Dev 2. Lugares del catálogo, posición de usePosition() y tarjeta del lugar elegido.
// `arriba` y `abajo` son capas sobre el mapa (flechas del recorrido, botón del panel).
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Map, { Marker, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { X } from '@phosphor-icons/react'
import type { Lugar } from '../../types/contratos'
import { usePosition } from '../geo/usePosition'
import Ilustracion from '../../components/ui/Ilustracion'
import Tarjeta from '../../components/ui/Tarjeta'
import Boton from '../../components/ui/Boton'
import './mapa.css'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
// Cámara limitada al Centro Histórico del puerto (regla de contratos §1)
const LIMITES: [[number, number], [number, number]] = [[-96.145, 19.19], [-96.127, 19.207]]

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
        initialViewState={{ latitude: pos?.lat ?? 19.1985, longitude: pos?.lng ?? -96.1365, zoom: 16 }}
        maxBounds={LIMITES}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
      >
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
