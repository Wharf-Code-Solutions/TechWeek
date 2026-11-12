// Pantalla: Fin · Responsable: Dev 2 (M12). Diseño 10 · Fin de la ruta.
// Pide confirmación antes de cerrar la ruta: /terminar paga el bono y no se puede deshacer.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Banderines from '../components/ui/Banderines'
import Ilustracion from '../components/ui/Ilustracion'
import { useCampo } from '../app/idioma'
import { BotonCompartir } from '../features/compartir'
import { Rompecabezas } from '../features/pasaporte'
import type { PasaporteDatos } from '../features/pasaporte/tipos'
import { eventosVigentes } from '../features/agenda/eventos'
import { ApiError, api, type ResumenRuta } from '../lib/api'
import seed from '../data/seed.json'
import type { Evento } from '../types/contratos'
import './fin.css'

type Estado = 'confirmar' | 'enviando' | 'sin-ruta' | 'error'

export default function Fin() {
  const { t, i18n } = useTranslation()
  const campo = useCampo()
  const navegar = useNavigate()
  const [resumen, setResumen] = useState<ResumenRuta | null>(null)
  const [pasaporte, setPasaporte] = useState<PasaporteDatos | null>(null)
  const [evento, setEvento] = useState<Evento | null>(null)
  const [estado, setEstado] = useState<Estado>('confirmar')

  async function terminar() {
    setEstado('enviando')
    try {
      setResumen(await api.terminarRuta())
      // Foto y piezas (la pieza de fin ya cuenta) y el próximo evento para "¿Y ahora qué?"
      api.pasaporte().then((p) => setPasaporte(p as PasaporteDatos)).catch(() => {})
      api
        .eventos()
        .catch(() => seed.eventos)
        .then((e) => setEvento(eventosVigentes(e as Evento[])[0] ?? null))
    } catch (e) {
      setEstado(e instanceof ApiError && e.status === 404 ? 'sin-ruta' : 'error')
    }
  }

  const alMapa = (pestana: string) => navegar('/mapa', { state: { pestana } })
  const hora = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Mexico_City',
  })

  return (
    <main className="fin">
      <Banderines fondo="#E4007C" />
      <div className="fin-cuerpo">
        {resumen ? (
          <>
            <div className="fin-titulo">
              <span>{t('fin.logrado')}</span>
              <h1>{t('fin.completada')}</h1>
            </div>

            <figure className="fin-foto">
              {pasaporte ? (
                <Rompecabezas piezas={pasaporte.piezas} url={pasaporte.foto?.url || null} />
              ) : (
                <div className="fin-foto-cargando" />
              )}
              <figcaption>
                {pasaporte?.piezas.completa
                  ? t('fin.fotoCompleta', { titulo: pasaporte.foto ? campo(pasaporte.foto, 'titulo') : '' })
                  : t('fin.fotoParcial', { n: pasaporte?.piezas.ganadas ?? 0, total: pasaporte?.piezas.total ?? 6 })}
              </figcaption>
            </figure>

            <dl className="fin-cifras">
              {/* dt antes de dd (HTML válido); el CSS muestra la cifra arriba */}
              <div>
                <dt>{t('fin.lugares', { count: resumen.visitados })}</dt>
                <dd>{resumen.visitados}</dd>
              </div>
              <div className="fin-cifra--bono">
                <dt>{t('fin.bonoFin')}</dt>
                <dd>+{resumen.bono}</dd>
              </div>
              <div>
                <dt>{t('fin.sellos', { count: resumen.retos_completados })}</dt>
                <dd className="fin-cifra--rosa">{resumen.retos_completados}</dd>
              </div>
            </dl>
            {/* Sin bono: o no hubo retos, o ya se cobró en una ruta anterior (se paga una vez por celular). */}
            {resumen.tlacos_distancia > 0 && (
              <p className="fin-nota">{t('fin.distancia', { metros: resumen.distancia_m, n: resumen.tlacos_distancia })}</p>
            )}
            {resumen.bono === 0 && (
              <p className="fin-nota">{resumen.retos_completados === 0 ? t('fin.sinBono') : t('fin.bonoCobrado')}</p>
            )}

            <span className="fin-ahora">{t('fin.yAhora')}</span>
            {evento && (
              <button type="button" className="fin-opcion" onClick={() => alMapa('agenda')}>
                <Ilustracion nombre={evento.categoria} tamano={36} />
                <span>
                  <strong>{campo(evento, 'titulo')}</strong>
                  <span>{hora.format(new Date(evento.inicio))}</span>
                </span>
              </button>
            )}
            <button type="button" className="fin-opcion" onClick={() => alMapa('cartera')}>
              <Ilustracion nombre="moneda" tamano={36} />
              <span>
                <strong>{t('fin.gasta')}</strong>
                <span>{t('fin.saldo', { n: resumen.saldo })}</span>
              </span>
            </button>

            {pasaporte && (
              <BotonCompartir
                rutaId={resumen.ruta_id}
                terminada
                datos={{
                  titulo: pasaporte.foto ? campo(pasaporte.foto, 'titulo') : 'JARANA',
                  paradas: resumen.visitados,
                  tlacos: resumen.saldo,
                  metros: resumen.distancia_m,
                  piezas: pasaporte.piezas,
                  fotoUrl: pasaporte.foto?.url || null,
                }}
              />
            )}

            <div className="fin-acciones">
              <button type="button" className="fin-boton" onClick={() => alMapa('pasaporte')}>
                {t('fin.verPasaporte')}
              </button>
              <button type="button" className="fin-boton fin-boton--claro" onClick={() => navegar('/')}>
                {t('fin.nueva')}
              </button>
            </div>
          </>
        ) : estado === 'sin-ruta' ? (
          <>
            <h1 className="fin-titulo">{t('pantallas.fin')}</h1>
            <p className="fin-pregunta" role="alert">{t('fin.sinRuta')}</p>
            <div className="fin-acciones">
              <button type="button" className="fin-boton" onClick={() => navegar('/')}>
                {t('fin.nueva')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="fin-titulo">
              <span>{t('pantallas.fin')}</span>
              <h1>{t('fin.confirmarTitulo')}</h1>
            </div>
            <p className="fin-pregunta">{t('fin.confirmar')}</p>
            {estado === 'error' && (
              <p className="fin-nota" role="alert">
                {t('comun.error')}
              </p>
            )}
            <div className="fin-acciones">
              <button type="button" className="fin-boton" disabled={estado === 'enviando'} onClick={terminar}>
                {estado === 'enviando' ? t('comun.cargando') : t('fin.si')}
              </button>
              <button
                type="button"
                className="fin-boton fin-boton--claro"
                disabled={estado === 'enviando'}
                onClick={() => navegar('/mapa')}
              >
                {t('fin.seguir')}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
