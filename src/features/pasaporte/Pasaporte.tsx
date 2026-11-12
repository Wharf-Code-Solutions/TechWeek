// M9 Pasaporte · Dev 2. Sellos de los retos completados y el rompecabezas de la foto histórica.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LockSimple } from '@phosphor-icons/react'
import Ilustracion from '../../components/ui/Ilustracion'
import Tarjeta from '../../components/ui/Tarjeta'
import { useCampo } from '../../app/idioma'
import { api } from '../../lib/api'
import { posicionPieza, type PasaporteDatos } from './tipos'
import './pasaporte.css'

// Sin foto todavía, cada pieza ganada se pinta con un color de la paleta.
const COLORES = ['var(--rosa)', 'var(--amarillo)', 'var(--turquesa)', 'var(--naranja)', 'var(--morado)', 'var(--verde)']

export default function Pasaporte() {
  const { t } = useTranslation()
  const campo = useCampo()
  const [datos, setDatos] = useState<PasaporteDatos | null>(null)
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    let vivo = true
    api
      .pasaporte()
      .then((d) => vivo && setDatos(d as PasaporteDatos))
      .catch(() => vivo && setFallo(true))
    return () => {
      vivo = false
    }
  }, [])

  if (fallo) return <p role="alert">{t('comun.error')}</p>
  if (!datos) return <p role="status">{t('comun.cargando')}</p>

  const { sellos, piezas, foto } = datos
  const url = foto?.url || null
  const filas = Math.ceil(piezas.total / 3)

  return (
    <section aria-labelledby="titulo-pasaporte">
      <h2 id="titulo-pasaporte" className="pasaporte-titulo">{t('pasaporte.titulo')}</h2>

      <h3 className="pasaporte-subtitulo">{foto ? campo(foto, 'titulo') : t('pasaporte.rompecabezas')}</h3>
      <p className="pasaporte-progreso">{t('pasaporte.piezas', { n: piezas.ganadas, total: piezas.total })}</p>
      <div
        className="pasaporte-rompecabezas"
        style={{ aspectRatio: `3 / ${filas}` }}
        role="img"
        aria-label={t('pasaporte.piezas', { n: piezas.ganadas, total: piezas.total })}
      >
        {Array.from({ length: piezas.total }, (_, i) => {
          const ganada = piezas.indices.includes(i)
          return (
            <span
              key={i}
              className={`pasaporte-pieza${ganada ? '' : ' pasaporte-pieza--falta'}`}
              style={
                ganada
                  ? url
                    ? {
                        backgroundImage: `url(${url})`,
                        backgroundSize: `300% ${filas * 100}%`,
                        backgroundPosition: posicionPieza(i, piezas.total),
                      }
                    : { background: COLORES[i % COLORES.length] }
                  : undefined
              }
            >
              {!ganada && <LockSimple size={22} weight="duotone" aria-hidden="true" />}
            </span>
          )
        })}
      </div>
      {piezas.completa && <p className="pasaporte-completa">{t('pasaporte.completa')}</p>}

      <h3 className="pasaporte-subtitulo">{t('pasaporte.sellos', { n: sellos.length })}</h3>
      {sellos.length === 0 ? (
        <p>{t('pasaporte.sinSellos')}</p>
      ) : (
        <ul className="pasaporte-sellos">
          {sellos.map((s) => (
            <li key={s.lugar_slug}>
              <Tarjeta className="pasaporte-sello">
                <Ilustracion nombre={s.ilustracion} tamano={56} />
                <div>
                  <strong>{campo(s, 'nombre')}</strong>
                  <p className="pasaporte-detalle">
                    {s.acerto ? t('pasaporte.acerto') : t('pasaporte.ayuda')} · {t('pasaporte.tlacos', { n: s.tlacos })}
                  </p>
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
