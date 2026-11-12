// Tarjeta de un negocio de la vitrina: la usan la lista (/vitrina) y el detalle (/vitrina/:slug).
import { Clock, MapPin, Star, Tag } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useCampo } from '../../app/idioma'
import Ilustracion from '../../components/ui/Ilustracion'
import type { Comercio } from '../../types/contratos'
import { ilustracionDeTipo } from './vitrina'
import estilos from './TarjetaComercio.module.css'

interface Props {
  comercio: Comercio
  /** Abre las promociones del aliado (la cartera). */
  onPromos: () => void
  /** Si se pasa, aparece el botón "Ver en el mapa". */
  onMapa?: () => void
  /** Título como encabezado principal de la página (detalle) en vez de h2 (lista). */
  principal?: boolean
}

export default function TarjetaComercio({ comercio: c, onPromos, onMapa, principal = false }: Props) {
  const { t } = useTranslation()
  const campo = useCampo()
  const dato = campo(c, 'dato')
  const Titulo = principal ? 'h1' : 'h2'

  return (
    <article className={`${estilos.tarjeta}${c.aliado ? ` ${estilos.aliado}` : ''}`}>
      <div className={estilos.imagen}>
        {c.foto_url ? (
          <img className={estilos.foto} src={c.foto_url} alt={c.nombre} loading="lazy" />
        ) : (
          <Ilustracion nombre={ilustracionDeTipo(c.tipo)} tamano={84} />
        )}
        {c.aliado && (
          <span className={estilos.insignia}>
            <Star size={16} weight="fill" aria-hidden="true" />
            {t('vitrina.aliado')}
          </span>
        )}
      </div>

      <div className={estilos.cuerpo}>
        <span className={estilos.tipo}>{t(`vitrina.tipos.${c.tipo}`)}</span>
        <Titulo>{c.nombre}</Titulo>
        {dato && <span className={estilos.dato}>{dato}</span>}
        <p className={estilos.descripcion}>{campo(c, 'descripcion')}</p>

        <ul className={estilos.datos}>
          <li>
            <MapPin size={18} weight="duotone" aria-hidden="true" />
            <span>{c.direccion}</span>
          </li>
          <li>
            <Clock size={18} weight="duotone" aria-hidden="true" />
            <span>{campo(c, 'horario')}</span>
          </li>
        </ul>

        {c.aliado && (
          <button type="button" className={estilos.promos} onClick={onPromos}>
            <Tag size={18} weight="duotone" aria-hidden="true" />
            {t('vitrina.ver_promos')}
          </button>
        )}
        {onMapa && (
          <button type="button" className={estilos.boton} onClick={onMapa}>
            <MapPin size={18} weight="duotone" aria-hidden="true" />
            {t('vitrina.ver_en_mapa')}
          </button>
        )}
      </div>
    </article>
  )
}
