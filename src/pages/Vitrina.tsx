// Pantalla: Vitrina de comercios · Dev 1 entregó GET /api/comercios; la pantalla es de Dev 2 + Dev 3.
// Negocios del Centro Histórico con filtros por tipo; los aliados (con promoción en JARANA) salen primero.
import { CaretLeft, Clock, MapPin, Star, Tag } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCampo } from '../app/idioma'
import Ilustracion from '../components/ui/Ilustracion'
import { TIPOS, contarPorTipo, filtrarComercios, ilustracionDeTipo } from '../features/vitrina/vitrina'
import { useVitrina } from '../features/vitrina/useVitrina'
import type { TipoComercio } from '../types/contratos'
import estilos from './Vitrina.module.css'

export default function Vitrina() {
  const { t } = useTranslation()
  const campo = useCampo()
  const navegar = useNavigate()
  const { comercios, cargando } = useVitrina()
  const [tipo, setTipo] = useState<TipoComercio | null>(null)

  const cuenta = useMemo(() => contarPorTipo(comercios), [comercios])
  const lista = useMemo(() => filtrarComercios(comercios, tipo), [comercios, tipo])
  // Solo se ofrecen los tipos que tienen comercios.
  const tipos = TIPOS.filter((x) => cuenta[x])

  return (
    <main className={estilos.pantalla}>
      <header className={estilos.cabecera}>
        <button type="button" className={estilos.volver} aria-label={t('vitrina.volver')} onClick={() => navegar('/mapa')}>
          <CaretLeft size={22} weight="bold" aria-hidden="true" />
        </button>
        <div>
          <h1>{t('vitrina.titulo')}</h1>
          <p>{t('vitrina.subtitulo')}</p>
        </div>
      </header>

      <div className={estilos.filtros} role="group" aria-label={t('vitrina.filtrar')}>
        <button type="button" aria-pressed={tipo === null} onClick={() => setTipo(null)}>
          {t('vitrina.todos')} <span>{comercios.length}</span>
        </button>
        {tipos.map((x) => (
          <button key={x} type="button" aria-pressed={tipo === x} onClick={() => setTipo(x)}>
            {t(`vitrina.tipos.${x}`)} <span>{cuenta[x]}</span>
          </button>
        ))}
      </div>

      {cargando && comercios.length === 0 && <p role="status">{t('comun.cargando')}</p>}
      <p className="solo-lectores" role="status">
        {t('vitrina.resultados', { count: lista.length })}
      </p>

      <ul className={estilos.lista}>
        {lista.map((c) => {
          const dato = campo(c, 'dato')
          return (
            <li key={c.slug}>
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
                  <h2>{c.nombre}</h2>
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
                    <button
                      type="button"
                      className={estilos.promos}
                      onClick={() => navegar('/mapa', { state: { pestana: 'cartera' } })}
                    >
                      <Tag size={18} weight="duotone" aria-hidden="true" />
                      {t('vitrina.ver_promos')}
                    </button>
                  )}
                </div>
              </article>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
