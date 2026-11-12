// Pantalla 04: ¡Llegaste! + curiosidad · Responsable: Dev 3
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from '@phosphor-icons/react'
import { useLugares } from '../app/datos'
import { useCampo } from '../app/idioma'
import Boton from '../components/ui/Boton'
import Ilustracion from '../components/ui/Ilustracion'
import { urlIlustracion } from '../components/ui/ilustraciones'
import { activarExplorador } from '../features/geo/explorador'
import { usePosition, useEstadoUbicacion } from '../features/geo/usePosition'
import { ApiError, api } from '../lib/api'
import estilos from './Lugar.module.css'

type Registro = 'pendiente' | 'ok' | 'fuera' | 'error'

export default function Lugar() {
  const { t } = useTranslation()
  const campo = useCampo()
  const navegar = useNavigate()
  const { slug } = useParams()
  const lugar = useLugares().find((l) => l.slug === slug)

  const pos = usePosition()
  const estado = useEstadoUbicacion()
  const explorador = estado === 'denegado' || estado === 'no-disponible'
  const hayPosicion = pos !== null
  const posRef = useRef(pos)
  posRef.current = pos
  const [registro, setRegistro] = useState<Registro>('pendiente')
  // Solo fuerza un render tras salir del modo explorador (la bandera vive en sessionStorage).
  const [, setReintento] = useState(0)
  const [parada, setParada] = useState<{ n: number; total: number } | null>(null)
  const [premio, setPremio] = useState<number | null>(null)

  // Parada n de N (ruta activa) y Tlacos del reto: son adornos, si fallan la pantalla funciona igual.
  useEffect(() => {
    if (!slug) return
    let vivo = true
    api
      .rutaActual()
      .then((r) => {
        const i = r.lugares.findIndex((l) => l.slug === slug)
        if (vivo && i >= 0) setParada({ n: i + 1, total: r.lugares.length })
      })
      .catch(() => {})
    api
      .retoDeLugar(slug)
      .then((r) => vivo && setPremio((r as { tlacos?: number }).tlacos ?? null))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [slug])

  // La llegada se registra en el servidor una sola vez; con gps él valida el radio de 40 m.
  useEffect(() => {
    const p = posRef.current
    if (!slug || explorador || !p) return
    let vivo = true
    api
      .registrarLlegada(slug, p.fuente, p.lat, p.lng)
      .then(() => vivo && setRegistro('ok'))
      .catch((e) => vivo && setRegistro(e instanceof ApiError && e.status === 403 ? 'fuera' : 'error'))
    return () => {
      vivo = false
    }
  }, [slug, explorador, hayPosicion])

  if (!lugar) {
    return (
      <main className={estilos.pantalla}>
        <div className={estilos.hoja}>
          <p role="alert">{t('lugar.no_encontrado')}</p>
          <Boton ancho onClick={() => navegar('/mapa')}>
            {t('lugar.volver')}
          </Boton>
        </div>
      </main>
    )
  }

  // Lejos del lugar (el servidor responde 403) se puede jugar igual en modo demo: la visita se registra como demo.
  function jugarEnDemo() {
    if (!slug) return
    setRegistro('pendiente')
    api
      .registrarLlegada(slug, 'demo')
      .then(() => setRegistro('ok'))
      .catch(() => setRegistro('error'))
  }

  const mensaje = explorador
    ? t('lugar.explorador')
    : registro === 'fuera'
      ? t('lugar.fuera')
      : registro === 'error'
        ? t('comun.error')
        : registro === 'pendiente'
          ? hayPosicion
            ? t('lugar.registrando')
            : t('lugar.buscando')
          : null

  const escena = lugar.categoria === 'leyendas' ? 'escena-leyenda' : 'escena-puerto'
  const categoria = t(`preferencias.categorias.${lugar.categoria}`)

  return (
    <main className={estilos.pantalla}>
      <div className={estilos.escena} style={{ backgroundImage: `url("${urlIlustracion(escena)}")` }}>
        <span className={estilos.pildora}>{t('pantallas.lugar')}</span>
        <button type="button" className={estilos.cerrar} aria-label={t('mapa.cerrar')} onClick={() => navegar('/mapa')}>
          <X size={22} weight="bold" aria-hidden="true" />
        </button>
      </div>

      <div className={estilos.hoja}>
        <span className={estilos.antetitulo}>
          {parada ? t('lugar.antetitulo', { categoria, n: parada.n, total: parada.total }) : categoria}
        </span>
        <h1 className={estilos.nombre}>{campo(lugar, 'nombre')}</h1>

        <div className={estilos.curiosidad}>
          <Ilustracion nombre="foco" tamano={40} />
          <div>
            <strong>{t('lugar.curiosidad')}</strong>
            <p>{campo(lugar, 'curiosidad')}</p>
          </div>
        </div>

        {mensaje && <p role="status">{mensaje}</p>}

        {explorador && (
          <Boton
            ancho
            variante="amarillo"
            onClick={() => {
              activarExplorador(false) // vuelve a pedir la ubicación; si la niega, sigue como explorador
              setReintento((n) => n + 1)
            }}
          >
            {t('lugar.activar_ubicacion')}
          </Boton>
        )}

        {registro === 'fuera' && !explorador && (
          <Boton ancho variante="amarillo" onClick={jugarEnDemo}>
            {t('lugar.jugar_demo')}
          </Boton>
        )}

        {!explorador && (
          <Boton ancho disabled={registro !== 'ok'} onClick={() => navegar(`/reto/${lugar.slug}`)}>
            {premio ? t('lugar.jugar_premio', { n: premio }) : t('lugar.jugar')}
          </Boton>
        )}
        <button type="button" className={estilos.enlace} onClick={() => navegar('/mapa')}>
          {t('lugar.seguir')}
        </button>
      </div>
    </main>
  )
}
