// M11 Agenda · Dev 2. Diseño 11 (Panel: Agenda): selector de 5 días y tarjetas de color; "EN VIVO" en naranja.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Ilustracion from '../../components/ui/Ilustracion'
import { api } from '../../lib/api'
import { useCampo } from '../../app/idioma'
import seed from '../../data/seed.json'
import type { Evento } from '../../types/contratos'
import { distanciaM } from '../geo/distancia'
import { usePosition } from '../geo/usePosition'
import { formatoDistancia } from '../mapa/progreso'
import { diaVeracruz, enCurso, eventosVigentes, proximosDias } from './eventos'
import './agenda.css'

const ZONA = 'America/Mexico_City'
const FONDOS = ['#fff3b0', '#e5fafc', '#f3e8ff']

export default function Agenda() {
  const { t, i18n } = useTranslation()
  const campo = useCampo()
  const pos = usePosition()
  const [eventos, setEventos] = useState<Evento[]>(seed.eventos as Evento[])
  const dias = proximosDias(5)
  const [dia, setDia] = useState(dias[0])

  useEffect(() => {
    let vivo = true
    api
      .eventos()
      .then((d) => vivo && setEventos(d as Evento[]))
      .catch(() => {}) // sin backend: se queda el seed
    return () => {
      vivo = false
    }
  }, [])

  // Las horas se muestran en la hora de Veracruz aunque el celular esté en otra zona.
  const hora = new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit', timeZone: ZONA })
  const semana = new Intl.DateTimeFormat(i18n.language, { weekday: 'short', timeZone: ZONA })
  const delDia = eventosVigentes(eventos).filter((e) => diaVeracruz(e.inicio) === dia || (enCurso(e) && dia === dias[0]))

  return (
    <section className="agenda" aria-labelledby="titulo-agenda">
      <div className="agenda-encabezado">
        <h2 id="titulo-agenda">{t('agenda.titulo')}</h2>
        <span>{t('agenda.enMapa')}</span>
      </div>

      <div className="agenda-dias" role="group" aria-label={t('agenda.dia')}>
        {dias.map((d, i) => {
          const fecha = new Date(`${d}T12:00:00-06:00`)
          return (
            <button key={d} type="button" aria-pressed={d === dia} onClick={() => setDia(d)}>
              <span>{i === 0 ? t('agenda.hoy') : semana.format(fecha).replace('.', '')}</span>
              <strong>{Number(d.slice(8))}</strong>
            </button>
          )
        })}
      </div>

      {delDia.length === 0 ? (
        <p className="agenda-vacia">{t('agenda.vacia')}</p>
      ) : (
        <ul className="agenda-lista">
          {delDia.map((e, i) => {
            const vivo = enCurso(e)
            const lejos = pos ? ` · ${t('agenda.a', { dist: formatoDistancia(distanciaM(pos, e)) })}` : ''
            return (
              <li key={e.slug} className="agenda-evento" style={{ background: vivo ? 'var(--naranja)' : FONDOS[i % FONDOS.length] }}>
                <span className="agenda-icono">
                  <Ilustracion nombre={e.categoria} tamano={40} />
                </span>
                <div>
                  {vivo && <span className="agenda-vivo">{t('agenda.ahora')}</span>}
                  <h3>{campo(e, 'titulo')}</h3>
                  <p>
                    {hora.format(new Date(e.inicio))} – {hora.format(new Date(e.fin))}
                    {lejos}
                  </p>
                  <p className="agenda-lugar">{e.lugar}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
