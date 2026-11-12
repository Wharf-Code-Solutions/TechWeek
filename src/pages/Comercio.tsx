// Pantalla: detalle de un negocio de la vitrina (/vitrina/:slug). Se llega desde "¿Dónde comer?" en el mapa.
import { CaretLeft } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import TarjetaComercio from '../features/vitrina/TarjetaComercio'
import { useVitrina } from '../features/vitrina/useVitrina'
import estilos from './Vitrina.module.css'

export default function Comercio() {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const { slug } = useParams()
  const { comercios, cargando } = useVitrina()
  const comercio = comercios.find((c) => c.slug === slug)

  return (
    <main className={estilos.pantalla}>
      <header className={estilos.cabecera}>
        <button type="button" className={estilos.volver} aria-label={t('vitrina.volver')} onClick={() => navegar(-1)}>
          <CaretLeft size={22} weight="bold" aria-hidden="true" />
        </button>
        <div>
          <p>{t('vitrina.titulo')}</p>
        </div>
      </header>

      {comercio ? (
        <TarjetaComercio
          principal
          comercio={comercio}
          onPromos={() => navegar('/mapa', { state: { pestana: 'cartera' } })}
          onMapa={() =>
            navegar('/mapa', { state: { comercio: { lat: comercio.lat, lng: comercio.lng, nombre: comercio.nombre } } })
          }
        />
      ) : (
        <p role={cargando ? 'status' : 'alert'}>{cargando ? t('comun.cargando') : t('vitrina.no_encontrado')}</p>
      )}

      <button type="button" className={estilos.todos} onClick={() => navegar('/vitrina')}>
        {t('vitrina.ver_todos')}
      </button>
    </main>
  )
}
