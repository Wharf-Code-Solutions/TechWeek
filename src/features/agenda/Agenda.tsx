// M11 Agenda · Dev 2. Eventos del Centro Histórico que aún no terminan.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarBlank, MapPin } from '@phosphor-icons/react'
import Tarjeta from '../../components/ui/Tarjeta'
import { api } from '../../lib/api'
import { useCampo } from '../../app/idioma'
import seed from '../../data/seed.json'
import type { Evento } from '../../types/contratos'
import { enCurso, eventosVigentes } from './eventos'
import './agenda.css'

export default function Agenda() {
  const { t, i18n } = useTranslation()
  const campo = useCampo()
  const [eventos, setEventos] = useState<Evento[]>(seed.eventos as Evento[])

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
  const formato = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Mexico_City',
  })
  const hora = new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit', timeZone: 'America/Mexico_City' })
  const vigentes = eventosVigentes(eventos)

  return (
    <section aria-labelledby="titulo-agenda">
      <h2 id="titulo-agenda" className="agenda-titulo">{t('agenda.titulo')}</h2>
      {vigentes.length === 0 ? (
        <p>{t('agenda.vacia')}</p>
      ) : (
        <ul className="agenda-lista">
          {vigentes.map((e) => (
            <li key={e.slug}>
              <Tarjeta className="agenda-evento">
                {enCurso(e) && <span className="agenda-ahora">{t('agenda.ahora')}</span>}
                <strong>{campo(e, 'titulo')}</strong>
                <span className="agenda-dato">
                  <CalendarBlank size={20} weight="duotone" aria-hidden="true" />
                  {formato.format(new Date(e.inicio))} – {hora.format(new Date(e.fin))}
                </span>
                <span className="agenda-dato">
                  <MapPin size={20} weight="duotone" aria-hidden="true" />
                  {e.lugar}
                </span>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
