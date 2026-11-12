// M4 Mapa Mapbox · Dev 2. Lugares del catálogo con su estado en la ruta (diseño 03), eventos en curso,
// posición de usePosition() y tarjeta del lugar elegido.
// `arriba` y `abajo` son capas sobre el mapa (cabecera, flechas del recorrido).
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Map, { Layer, Marker, Source, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Check, Crosshair, ForkKnife, Storefront, TextAa, X } from '@phosphor-icons/react'
import type { Comercio, Evento, Lugar } from '../../types/contratos'
import { useRecorridoDemo } from '../geo/demoStore'
import { distanciaM } from '../geo/distancia'
import { RECORRIDO_DEMO } from '../geo/rutaDemo'
import type { Punto } from '../geo/tipos'
import { moverManual } from '../geo/posicionManual'
import { useModoManual, usePosition } from '../geo/usePosition'
import { tramoRestante } from '../geo/tramo'
import { useRutaCaminable } from '../geo/useRutaCaminable'
import Ilustracion from '../../components/ui/Ilustracion'
import TarjetaComercio from '../vitrina/TarjetaComercio'
import { comidaCercana, ilustracionDeTipo } from '../vitrina/vitrina'
import { useVitrina } from '../vitrina/useVitrina'
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
/** Duración de un pulso de la línea de la ruta (ms). */
const PULSO_MS = 1600
/**
 * Flujo de la ruta: rayas blancas que avanzan por la línea azul en el sentido del recorrido. Mapbox no anima
 * `line-dasharray` solo: se recorre esta secuencia de patrones desplazados (cada paso mueve el patrón medio cuadro).
 */
const FLUJO_PASOS: number[][] = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
  [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5],
]
const FLUJO_PASO_MS = 170
// Con este zoom o más cerca, todos los pines muestran su nombre; más lejos solo la siguiente parada y el pin tocado.
const ZOOM_ETIQUETAS = 17.6
// El Zócalo, corazón del Centro Histórico: aquí empieza el mapa.
const ZOCALO = { lat: 19.20023, lng: -96.13853 }

/** Empieza en el Zócalo; en el recorrido demo, donde está el personaje y mirando hacia donde camina. */
function vistaInicial(lugares: Lugar[], demo: { lat: number; lng: number; rumbo: number } | null) {
  if (demo) return { latitude: demo.lat, longitude: demo.lng, zoom: ZOOM + 0.5, pitch: 55, bearing: demo.rumbo }
  const zocalo = lugares.find((l) => l.slug === 'zocalo') ?? ZOCALO
  return { latitude: zocalo.lat, longitude: zocalo.lng, zoom: ZOOM, pitch: 55 }
}

type Estado = 'hecho' | 'siguiente' | 'ruta' | 'fuera'

interface Props {
  lugares: Lugar[]
  /** Paradas de la ruta activa, en orden: se unen con una línea azul por las calles. */
  ruta?: Lugar[]
  /** Dónde estaba el turista al armar la ruta: la línea azul arranca ahí. */
  origen?: Punto | null
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
  /** Lugar que hay que mostrar (la lista de la ruta lo pide): el mapa vuela hasta él y abre su tarjeta. `n` cambia en cada toque. */
  enfocar?: { slug: string; n: number } | null
  /** Negocio de la vitrina que hay que mostrar en el mapa ("Ver en el mapa"): vuela hasta él y lo marca. */
  comercioFocal?: { lat: number; lng: number; nombre: string } | null
  /** Slug de la parada a la que el turista acaba de llegar: su pin hace un pulso mientras sale el aviso. */
  llegando?: string | null
  arriba?: ReactNode
  abajo?: ReactNode
}

const VACIO: ReadonlySet<string> = new Set()
const SIN_RUTA: Lugar[] = []

// Luz del estilo Standard: 'dawn' da tonos cálidos (cremas y durazno) que combinan con JARANA y dejan legibles
// pines y ruta; 'dusk' resultó demasiado oscuro.
const AMBIENTE = 'dawn'

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

interface PinProps {
  lugar: Lugar
  estado: Estado
  etiqueta: string | null
  etiquetaAria: string
  elegido: boolean
  llegando: boolean
  onElegir: (l: Lugar) => void
}

/** Un pin del mapa. Está memoizado: mover la cámara o la posición no vuelve a dibujar los 24 pines. */
const Pin = memo(function Pin({ lugar, estado, etiqueta, etiquetaAria, elegido, llegando, onElegir }: PinProps) {
  return (
    <Marker latitude={lugar.lat} longitude={lugar.lng} anchor="bottom" style={{ zIndex: estado === 'siguiente' ? 2 : 1 }}>
      <button
        type="button"
        className={`marcador marcador--${estado}${llegando ? ' marcador--llegando' : ''}`}
        aria-label={etiquetaAria}
        aria-pressed={elegido}
        onClick={() => onElegir(lugar)}
      >
        <span className="marcador-circulo">
          {estado === 'hecho' ? (
            <Check size={24} weight="bold" color="#fff" aria-hidden="true" />
          ) : (
            <Ilustracion nombre={lugar.ilustracion} tamano={estado === 'siguiente' ? 32 : 28} />
          )}
        </span>
        {etiqueta && <span className="marcador-etiqueta">{etiqueta}</span>}
      </button>
    </Marker>
  )
})

export default function MapaLugares({
  lugares,
  ruta = SIN_RUTA,
  origen = null,
  enRuta = VACIO,
  hechos = VACIO,
  siguiente = null,
  etiquetaSiguiente,
  eventos = [],
  onEvento,
  padAbajo = 0,
  enfocar = null,
  llegando = null,
  comercioFocal = null,
  arriba,
  abajo,
}: Props) {
  const { t, i18n } = useTranslation()
  const en = i18n.language === 'en'
  const pos = usePosition()
  // Lejos del Centro (o sin GPS) el turista sale del Zócalo y se mueve tocando el mapa.
  const modoManual = useModoManual()
  const [elegido, setElegido] = useState<Lugar | null>(null)
  // ¿Dónde comer?: con el botón se marcan en el mapa los lugares de comida; al tocar uno se despliega su vitrina.
  const [comer, setComer] = useState(false)
  const [comercio, setComercio] = useState<Comercio | null>(null)
  const { comercios } = useVitrina()
  const comida = useMemo(() => (comer ? comidaCercana(comercios, pos).map((x) => x.comercio) : []), [comer, comercios, pos])
  const mapa = useRef<MapRef>(null)
  const [zoom, setZoom] = useState(ZOOM)
  const elegir = useCallback((l: Lugar) => {
    setElegido(l)
    setComercio(null)
  }, [])
  const elegirComercio = (c: Comercio) => {
    setComercio(c)
    setElegido(null)
    mapa.current?.flyTo({ center: [c.lng, c.lat], duration: 700 })
  }
  const alternarComer = () => {
    setComer((v) => !v)
    setComercio(null)
  }
  const navegar = useNavigate()
  const linea = useRutaCaminable(ruta, origen)
  // Los textos de comercios y lugares de Mapbox estorban a los pines: apagados salvo que el turista los pida.
  // Los nombres de las calles siempre se ven.
  const [nombres, setNombres] = useState(leerNombres)
  const aplicarNombres = (activos: boolean) => {
    const m = mapa.current?.getMap()
    if (!m) return
    m.setConfigProperty('basemap', 'showPointOfInterestLabels', activos)
    m.setConfigProperty('basemap', 'showPlaceLabels', activos)
    m.setConfigProperty('basemap', 'showRoadLabels', true)
    m.setConfigProperty('basemap', 'lightPreset', AMBIENTE)
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

  // "Ver en el mapa" desde la vitrina: la cámara vuela hasta el negocio.
  useEffect(() => {
    if (!comercioFocal) return
    mapa.current?.flyTo({ center: [comercioFocal.lng, comercioFocal.lat], zoom: ZOOM + 1, duration: 1000 })
  }, [comercioFocal])

  // Al llegar a una parada la cámara se acerca y gira un poco hacia ella, mientras sale el aviso y suben las olas.
  useEffect(() => {
    if (!llegando) return
    const l = lugares.find((x) => x.slug === llegando)
    const m = mapa.current
    if (!l || !m) return
    m.easeTo({
      center: [l.lng, l.lat],
      zoom: m.getZoom() + 1,
      bearing: m.getBearing() + 35,
      duration: 800,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    })
  }, [llegando, lugares])

  // En el recorrido virtual la cámara sigue al turista y gira hacia donde camina; con GPS se deja mover libre.
  const demo = pos?.fuente === 'demo'
  const rec = useRecorridoDemo()
  const previa = useRef<Punto | null>(null)
  useEffect(() => {
    if (!demo || !pos) return
    const m = mapa.current
    // Un salto grande (ir a la siguiente parada) se recorre volando; un paso corto, con un movimiento suave.
    const salto = previa.current ? distanciaM(previa.current, pos) > 60 : false
    previa.current = pos
    const camara = { center: [pos.lng, pos.lat] as [number, number], bearing: rec.rumbo, pitch: 55 }
    if (salto) m?.flyTo({ ...camara, duration: 1200 })
    else m?.easeTo({ ...camara, duration: 500 })
  }, [demo, pos, rec.rumbo])

  // Guía: el tramo que falta hasta la siguiente parada se resalta sobre el resto de la ruta.
  // En la demo sale del recorrido virtual; con GPS, de tu posición a la siguiente parada siguiendo la línea azul.
  const siguienteParada = Math.min(rec.parada + 1, rec.paradas.length - 1)
  const destino = useMemo(() => lugares.find((l) => l.slug === siguiente) ?? null, [lugares, siguiente])
  const datosGuia = useMemo(() => {
    let coordinates: [number, number][] = []
    if (demo) coordinates = RECORRIDO_DEMO.camino(rec.metros, RECORRIDO_DEMO.metrosDeParada(siguienteParada))
    else if (pos && destino && linea.length > 1) coordinates = tramoRestante(linea, pos, destino)
    return { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates } }
  }, [demo, rec.metros, siguienteParada, pos, destino, linea])
  const hayGuia = datosGuia.geometry.coordinates.length > 1

  // Pulso: un halo amarillo que se expande y se desvanece sobre el tramo que falta, para ubicar de un vistazo hacia
  // dónde seguir. Se anima a ~20 cuadros por segundo y se apaga con "reducir movimiento".
  useEffect(() => {
    if (!hayGuia || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const m = mapa.current?.getMap()
    if (!m) return
    let cuadro = 0
    let ultimo = 0
    const animar = (t: number) => {
      cuadro = requestAnimationFrame(animar)
      if (t - ultimo < 50 || !m.getLayer('guia-pulso')) return
      ultimo = t
      const f = (t % PULSO_MS) / PULSO_MS
      m.setPaintProperty('guia-pulso', 'line-width', 12 + 24 * f)
      m.setPaintProperty('guia-pulso', 'line-opacity', 0.7 * (1 - f))
    }
    cuadro = requestAnimationFrame(animar)
    return () => cancelAnimationFrame(cuadro)
  }, [hayGuia])

  // Flujo: rayas blancas que corren por la ruta para que no se vea como una línea azul fija.
  // Se apaga con "reducir movimiento" (las rayas quedan quietas).
  const hayRuta = linea.length > 1
  useEffect(() => {
    if (!hayRuta || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const m = mapa.current?.getMap()
    if (!m) return
    let cuadro = 0
    let paso = -1
    const animar = (t: number) => {
      cuadro = requestAnimationFrame(animar)
      const nuevo = Math.floor(t / FLUJO_PASO_MS) % FLUJO_PASOS.length
      if (nuevo === paso) return
      paso = nuevo
      // La guía (tramo que falta) tapa la ruta: sus rayas van en su propia capa.
      for (const id of ['ruta-flujo', 'guia-flujo']) if (m.getLayer(id)) m.setPaintProperty(id, 'line-dasharray', FLUJO_PASOS[nuevo])
    }
    cuadro = requestAnimationFrame(animar)
    return () => cancelAnimationFrame(cuadro)
  }, [hayRuta, hayGuia])

  // El mapa ocupa toda la pantalla (sin redimensionar el lienzo); al plegar o abrir el panel solo se mueve el centro.
  const ultimoEnfoque = useRef(0)
  useEffect(() => {
    if (!enfocar || enfocar.n === ultimoEnfoque.current) return
    const l = lugares.find((x) => x.slug === enfocar.slug)
    if (!l) return
    ultimoEnfoque.current = enfocar.n
    setElegido(l)
    const m = mapa.current
    m?.flyTo({ center: [l.lng, l.lat], zoom: Math.max(m.getZoom(), ZOOM + 0.5), duration: 900 })
  }, [enfocar, lugares])

  useEffect(() => {
    mapa.current?.easeTo({ padding: { top: 0, left: 0, right: 0, bottom: padAbajo }, duration: 250 })
  }, [padAbajo])

  // Si el turista se movió del mapa, este botón lo vuelve a centrar en su posición.
  const irAMiUbicacion = () => {
    if (!pos) return
    mapa.current?.flyTo({ center: [pos.lng, pos.lat], zoom: Math.max(zoom, ZOOM + 0.5), duration: 800 })
  }

  // La línea de la ruta solo se reconstruye cuando cambia la ruta, no con cada render.
  const datosRuta = useMemo(
    () => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: linea } }),
    [linea],
  )

  const estado = (slug: string): Estado =>
    hechos.has(slug) ? 'hecho' : slug === siguiente ? 'siguiente' : enRuta.size === 0 || enRuta.has(slug) ? 'ruta' : 'fuera'

  if (!TOKEN) return <p className="mapa-aviso">{t('mapa.sinToken')}</p>

  return (
    <div className="mapa">
      <Map
        ref={mapa}
        mapboxAccessToken={TOKEN}
        initialViewState={{
          ...vistaInicial(lugares, demo && pos ? { lat: pos.lat, lng: pos.lng, rumbo: rec.rumbo } : null),
          padding: { top: 0, left: 0, right: 0, bottom: padAbajo },
        }}
        maxBounds={LIMITES}
        // Rendimiento: sin suavizado de bordes ni copias del mundo, y una caché de teselas acotada.
        antialias={false}
        renderWorldCopies={false}
        maxTileCacheSize={60}
        fadeDuration={120}
        onClick={(e) => {
          // Un toque en el mapa mueve al turista; los toques en pines y en su propio marcador no.
          if (!modoManual || (e.originalEvent.target as HTMLElement).closest('.marcador, .mapa-yo')) return
          moverManual({ lat: e.lngLat.lat, lng: e.lngLat.lng })
        }}
        onZoomEnd={(e) => setZoom(e.viewState.zoom)}
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
            data={datosRuta}
          >
            {/* slot "middle": sobre calles y edificios, bajo los textos del estilo Standard */}
            <Layer
              id="ruta-contorno"
              type="line"
              slot="middle"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': '#ffffff', 'line-width': 11, 'line-opacity': hayGuia ? 0.5 : 1, 'line-emissive-strength': 1 }}
            />
            <Layer
              id="ruta-linea"
              type="line"
              slot="middle"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': AZUL_RUTA, 'line-width': 6, 'line-opacity': hayGuia ? 0.45 : 1, 'line-emissive-strength': 1 }}
            />
            <Layer
              id="ruta-flujo"
              type="line"
              slot="middle"
              layout={{ 'line-cap': 'butt', 'line-join': 'round' }}
              paint={{
                'line-color': '#ffffff',
                'line-width': 3.5,
                'line-opacity': hayGuia ? 0.4 : 0.9,
                'line-dasharray': FLUJO_PASOS[0],
                'line-emissive-strength': 1,
              }}
            />
          </Source>
        )}
        {hayGuia && (
          <Source id="guia" type="geojson" data={datosGuia}>
            <Layer
              id="guia-pulso"
              type="line"
              slot="middle"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': '#FFD400', 'line-width': 16, 'line-opacity': 0.45, 'line-emissive-strength': 1 }}
            />
            <Layer
              id="guia-contorno"
              type="line"
              slot="middle"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': '#ffffff', 'line-width': 14, 'line-emissive-strength': 1 }}
            />
            <Layer
              id="guia-linea"
              type="line"
              slot="middle"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': AZUL_RUTA, 'line-width': 8, 'line-emissive-strength': 1 }}
            />
            <Layer
              id="guia-flujo"
              type="line"
              slot="middle"
              layout={{ 'line-cap': 'butt', 'line-join': 'round' }}
              paint={{ 'line-color': '#ffffff', 'line-width': 4.5, 'line-opacity': 0.9, 'line-dasharray': FLUJO_PASOS[0], 'line-emissive-strength': 1 }}
            />
          </Source>
        )}
        {lugares.map((l) => {
          const e = estado(l.slug)
          const nombre = en ? l.nombre_en : l.nombre_es
          const tocado = elegido?.slug === l.slug
          const conNombre = e === 'siguiente' || tocado || zoom >= ZOOM_ETIQUETAS
          return (
            <Pin
              key={l.slug}
              lugar={l}
              estado={e}
              etiqueta={conNombre ? (e === 'siguiente' && etiquetaSiguiente ? etiquetaSiguiente : nombre) : null}
              etiquetaAria={e === 'ruta' || e === 'fuera' ? nombre : t(`mapa.estado_${e}`, { nombre })}
              elegido={tocado}
              llegando={llegando === l.slug}
              onElegir={elegir}
            />
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
        {comercioFocal && (
          <Marker latitude={comercioFocal.lat} longitude={comercioFocal.lng} anchor="bottom" style={{ zIndex: 3 }}>
            <span className="marcador marcador--comercio">
              <span className="marcador-circulo">
                <Storefront size={24} weight="duotone" aria-hidden="true" />
              </span>
              <span className="marcador-etiqueta">{comercioFocal.nombre}</span>
            </span>
          </Marker>
        )}
        {comida.map((c) => {
          const activo = comercio?.slug === c.slug
          return (
            <Marker key={c.slug} latitude={c.lat} longitude={c.lng} anchor="bottom" style={{ zIndex: activo ? 4 : 2 }}>
              <button
                type="button"
                className={`marcador marcador--comida${activo ? ' marcador--comida-activo' : ''}`}
                aria-label={c.nombre}
                aria-pressed={activo}
                onClick={() => elegirComercio(c)}
              >
                <span className="marcador-circulo">
                  <Ilustracion nombre={ilustracionDeTipo(c.tipo)} tamano={28} />
                </span>
                {activo && <span className="marcador-etiqueta">{c.nombre}</span>}
              </button>
            </Marker>
          )
        })}
        {pos && (
          <Marker latitude={pos.lat} longitude={pos.lng} style={{ zIndex: 3 }}>
            <span className={`mapa-yo${demo ? ' mapa-yo--demo' : ''}`} role="img" aria-label={t('mapa.tuPosicion')} />
          </Marker>
        )}
      </Map>

      {arriba && <div className="mapa-arriba">{arriba}</div>}
      {modoManual && (
        <p className="mapa-pista" role="status">
          {t('mapa.pista_toque')}
        </p>
      )}

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

      <button
        type="button"
        className="mapa-nombres mapa-vitrina"
        aria-label={t('mapa.restaurantes')}
        title={t('mapa.restaurantes')}
        aria-pressed={comer}
        onClick={alternarComer}
      >
        <ForkKnife size={22} weight="bold" aria-hidden="true" />
      </button>

      {pos && (
        <button
          type="button"
          className="mapa-nombres mapa-ubicacion"
          aria-label={t('mapa.miUbicacion')}
          title={t('mapa.miUbicacion')}
          onClick={irAMiUbicacion}
        >
          <Crosshair size={22} weight="bold" aria-hidden="true" />
        </button>
      )}

      <div className="mapa-abajo">
        {comercio && (
          <div className="mapa-vitrina-hoja">
            <button type="button" className="mapa-vitrina-cerrar" aria-label={t('mapa.cerrar')} onClick={() => setComercio(null)}>
              <X size={20} weight="bold" aria-hidden="true" />
            </button>
            <TarjetaComercio comercio={comercio} onPromos={() => navegar('/mapa', { state: { pestana: 'cartera' } })} />
          </div>
        )}
        {elegido && (
          <Tarjeta className="mapa-tarjeta">
            <Boton variante="blanco" className="mapa-cerrar" aria-label={t('mapa.cerrar')} onClick={() => setElegido(null)}>
              <X size={20} weight="bold" />
            </Boton>
            <h2>{en ? elegido.nombre_en : elegido.nombre_es}</h2>
            <p>{en ? elegido.curiosidad_en : elegido.curiosidad_es}</p>
            {/* ¡Llegaste! registra la llegada (con GPS valida los 40 m; en la demo vale) y desde ahí se juega el reto. */}
            <Boton
              ancho
              onClick={() => {
                if (modoManual) moverManual(elegido) // lejos del Centro, "ir" es caminar hasta el lugar
                navegar(`/lugar/${elegido.slug}`)
              }}
            >
              {t('mapa.irAlLugar')}
            </Boton>
          </Tarjeta>
        )}
        {abajo}
      </div>
    </div>
  )
}
