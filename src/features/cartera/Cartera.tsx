// M10 · Cartera: saldo de doblones y promociones para canjear. Es el contenido de la pestaña
// "Cartera" del panel deslizable (M7, Dev 2). Diseño 13.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { usePromociones } from '../../app/datos'
import { useCampo } from '../../app/idioma'
import Ilustracion from '../../components/ui/Ilustracion'
import { distanciaM } from '../geo/distancia'
import { usePosition } from '../geo/usePosition'
import { formatoDistancia } from '../mapa/progreso'
import { api } from '../../lib/api'
import estilos from './Cartera.module.css'

// Una ilustración por promoción (slug de la promoción → nombre en el set).
const ILUSTRACION: Record<string, string> = {
  'cafe-2x1': 'cafe-lechero',
  volovan: 'volovan',
  nieve: 'nieve',
  'lancha-20': 'artesania', // la promoción ahora es de artesanías; la lancha del diseño queda en el set
}
const FONDOS = ['#DDF7FA', '#FFF3B0', '#E3F7E8', '#F4F1FA']

export default function Cartera() {
  const { t } = useTranslation()
  const campo = useCampo()
  const navegar = useNavigate()
  const promos = usePromociones()
  const pos = usePosition()
  const [saldo, setSaldo] = useState<number | null>(null)
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    let vivo = true
    api
      .saldo()
      .then((r) => vivo && setSaldo(r.saldo))
      .catch(() => vivo && setFallo(true))
    return () => {
      vivo = false
    }
  }, [])

  return (
    <section className={estilos.cartera} aria-labelledby="titulo-cartera">
      <h2 id="titulo-cartera" className="solo-lectores">
        {t('cartera.titulo')}
      </h2>

      <div className={estilos.saldo}>
        <Ilustracion nombre="moneda" tamano={66} />
        <div>
          <span className={estilos.etiqueta}>{t('cartera.tusTlacos')}</span>
          {fallo ? (
            <p role="alert">{t('cartera.sin_saldo')}</p>
          ) : saldo === null ? (
            <p role="status">{t('comun.cargando')}</p>
          ) : (
            <strong className={estilos.cifra}>{saldo}</strong>
          )}
        </div>
      </div>

      <div className={estilos.encabezado}>
        <h3 className={estilos.subtitulo}>{t('cartera.gastalos')}</h3>
        <span className={estilos.nota}>{t('cartera.cercaDeTi')}</span>
      </div>

      <ul className={estilos.lista}>
        {promos.map((p, i) => {
          const falta = saldo === null ? p.costo_tlacos : Math.max(p.costo_tlacos - saldo, 0)
          const alcanza = saldo !== null && falta === 0
          const dist =
            pos && p.lat !== undefined && p.lng !== undefined
              ? formatoDistancia(distanciaM(pos, { lat: p.lat, lng: p.lng }))
              : null
          return (
            <li key={p.slug} className={estilos.promo} style={{ background: FONDOS[i % FONDOS.length] }}>
              <span className={estilos.icono}>
                <Ilustracion nombre={ILUSTRACION[p.slug] ?? 'moneda'} tamano={42} />
              </span>
              <div className={estilos.texto}>
                <strong>{campo(p, 'titulo')}</strong>
                <span className={estilos.detalle}>{dist ? `${p.comercio} · ${dist}` : p.comercio}</span>
                {saldo !== null && falta > 0 && (
                  <span className={estilos.faltan}>{t('cartera.faltan', { n: falta })}</span>
                )}
              </div>
              {alcanza ? (
                <button
                  type="button"
                  className={estilos.canjear}
                  aria-label={`${t('cartera.canjear')}: ${campo(p, 'titulo')} · ${t('cartera.costo', { n: p.costo_tlacos })}`}
                  onClick={() => navegar(`/cupon/${p.slug}`)}
                >
                  <b>{p.costo_tlacos}</b>
                  <span>{t('cartera.canjear')}</span>
                </button>
              ) : (
                <span className={estilos.costo} aria-label={t('cartera.costo', { n: p.costo_tlacos })}>
                  {p.costo_tlacos}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
