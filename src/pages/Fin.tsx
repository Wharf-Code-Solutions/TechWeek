// Pantalla: Fin · Responsable: Dev 2 (M12)
// Pide confirmación antes de cerrar la ruta: /terminar paga el bono y no se puede deshacer.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Banderines from '../components/ui/Banderines'
import Boton from '../components/ui/Boton'
import Ilustracion from '../components/ui/Ilustracion'
import Tarjeta from '../components/ui/Tarjeta'
import { ApiError, api, type ResumenRuta } from '../lib/api'
import './fin.css'

type Estado = 'confirmar' | 'enviando' | 'sin-ruta' | 'error'

export default function Fin() {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const [resumen, setResumen] = useState<ResumenRuta | null>(null)
  const [estado, setEstado] = useState<Estado>('confirmar')

  async function terminar() {
    setEstado('enviando')
    try {
      setResumen(await api.terminarRuta())
    } catch (e) {
      setEstado(e instanceof ApiError && e.status === 404 ? 'sin-ruta' : 'error')
    }
  }

  return (
    <>
      <Banderines cuerda />
      <main className="fin">
        <h1>{t('pantallas.fin')}</h1>

        {resumen ? (
          <>
            <Tarjeta className="fin-resumen">
              <Ilustracion nombre="moneda" tamano={72} />
              {resumen.bono > 0 && <p className="fin-bono">{t('fin.bono', { n: resumen.bono })}</p>}
              <dl className="fin-datos">
                <dt>{t('fin.visitados')}</dt>
                <dd>{t('fin.deTotal', { n: resumen.visitados, total: resumen.total_lugares })}</dd>
                <dt>{t('fin.retos')}</dt>
                <dd>{resumen.retos_completados}</dd>
                <dt>{t('fin.saldo')}</dt>
                <dd>{t('fin.tlacos', { n: resumen.saldo })}</dd>
              </dl>
              {resumen.bono === 0 && <p>{t('fin.sinBono')}</p>}
            </Tarjeta>
            <div className="fin-acciones">
              <Boton ancho onClick={() => navegar('/')}>{t('fin.nueva')}</Boton>
            </div>
          </>
        ) : estado === 'sin-ruta' ? (
          <>
            <p role="alert">{t('fin.sinRuta')}</p>
            <div className="fin-acciones">
              <Boton ancho onClick={() => navegar('/')}>{t('fin.nueva')}</Boton>
            </div>
          </>
        ) : (
          <>
            <p className="fin-pregunta">{t('fin.confirmar')}</p>
            {estado === 'error' && <p className="fin-error" role="alert">{t('comun.error')}</p>}
            <div className="fin-acciones">
              <Boton ancho disabled={estado === 'enviando'} onClick={terminar}>
                {estado === 'enviando' ? t('comun.cargando') : t('fin.si')}
              </Boton>
              <Boton ancho variante="blanco" disabled={estado === 'enviando'} onClick={() => navegar('/mapa')}>
                {t('fin.seguir')}
              </Boton>
            </div>
          </>
        )}
      </main>
    </>
  )
}
