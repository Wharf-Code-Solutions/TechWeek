// Pantalla 04: ¡Llegaste! + curiosidad · Responsable: Dev 3
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useLugares } from '../app/datos'
import { useCampo } from '../app/idioma'
import Banderines from '../components/ui/Banderines'
import Boton from '../components/ui/Boton'
import Ilustracion from '../components/ui/Ilustracion'
import Tarjeta from '../components/ui/Tarjeta'
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
        <Banderines cuerda />
        <div className={estilos.contenido}>
          <p role="alert">{t('lugar.no_encontrado')}</p>
          <Boton ancho onClick={() => navegar('/mapa')}>
            {t('lugar.volver')}
          </Boton>
        </div>
      </main>
    )
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

  return (
    <main className={estilos.pantalla}>
      <Banderines cuerda />
      <div className={estilos.contenido}>
        <h1 className={estilos.titulo}>{t('pantallas.lugar')}</h1>

        <Tarjeta className={estilos.lugar}>
          <Ilustracion nombre={lugar.ilustracion} tamano={96} />
          <h2 className={estilos.nombre}>{campo(lugar, 'nombre')}</h2>
          <h3 className={estilos.subtitulo}>{t('lugar.curiosidad')}</h3>
          <p>{campo(lugar, 'curiosidad')}</p>
        </Tarjeta>

        {mensaje && <p role="status">{mensaje}</p>}

        {!explorador && (
          <Boton ancho disabled={registro !== 'ok'} onClick={() => navegar(`/reto/${lugar.slug}`)}>
            {t('lugar.jugar')}
          </Boton>
        )}
        <Boton ancho variante="blanco" onClick={() => navegar('/mapa')}>
          {t('lugar.volver')}
        </Boton>
      </div>
    </main>
  )
}
