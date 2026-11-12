// Hoja del mapa "¿Dónde comer?": cafeterías, restaurantes, fondas y neverías cerca del turista (aliados primero).
// Tocar uno abre su vitrina (/vitrina/:slug).
import { Star, X } from '@phosphor-icons/react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Ilustracion from '../../components/ui/Ilustracion'
import { formatoDistancia } from '../mapa/progreso'
import { usePosition } from '../geo/usePosition'
import { comidaCercana, ilustracionDeTipo } from './vitrina'
import { useVitrina } from './useVitrina'
import estilos from './HojaRestaurantes.module.css'

export default function HojaRestaurantes({ onCerrar }: { onCerrar: () => void }) {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const pos = usePosition()
  const { comercios } = useVitrina()
  const lista = useMemo(() => comidaCercana(comercios, pos), [comercios, pos])

  return (
    <div className={estilos.fondo} onClick={onCerrar}>
      <section
        className={estilos.hoja}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-comer"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={estilos.cabecera}>
          <div>
            <h2 id="titulo-comer">{t('vitrina.comer_titulo')}</h2>
            <p>{t('vitrina.comer_subtitulo')}</p>
          </div>
          <button type="button" className={estilos.cerrar} aria-label={t('vitrina.cerrar')} onClick={onCerrar}>
            <X size={20} weight="bold" aria-hidden="true" />
          </button>
        </header>

        {lista.length === 0 ? (
          <p role="status">{t('vitrina.comer_vacio')}</p>
        ) : (
          <ul className={estilos.lista}>
            {lista.map(({ comercio: c, metros }, i) => (
              <li key={c.slug} style={{ ['--i' as string]: Math.min(i, 8) }}>
                <button type="button" className={estilos.fila} onClick={() => navegar(`/vitrina/${c.slug}`)}>
                  <span className={estilos.icono}>
                    <Ilustracion nombre={ilustracionDeTipo(c.tipo)} tamano={40} />
                  </span>
                  <span className={estilos.texto}>
                    <strong>{c.nombre}</strong>
                    <span>
                      {t(`vitrina.tipos.${c.tipo}`)}
                      {metros !== null && ` · ${t('vitrina.a_metros', { dist: formatoDistancia(metros) })}`}
                    </span>
                  </span>
                  {c.aliado && (
                    <span className={estilos.aliado} title={t('vitrina.aliado')}>
                      <Star size={16} weight="fill" aria-hidden="true" />
                      <span className="solo-lectores">{t('vitrina.aliado')}</span>
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className={estilos.todos} onClick={() => navegar('/vitrina')}>
          {t('vitrina.ver_todos')}
        </button>
      </section>
    </div>
  )
}
