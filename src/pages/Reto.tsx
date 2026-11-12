// Pantalla: Reto · Responsable: Dev 2 (pantallas) · Dev 1 (validación)
// Al completarse navega a /recompensa/:slug con el resultado de completarReto() en location.state.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import Banderines from '../components/ui/Banderines'
import Boton from '../components/ui/Boton'
import JuegoPalabras from '../features/retos/JuegoPalabras'
import JuegoOrden from '../features/retos/JuegoOrden'
import { respuestaInicial, type RetoPublico } from '../features/retos/logica'
import '../features/retos/retos.css'

export default function Reto() {
  const { t, i18n } = useTranslation()
  const idioma = i18n.language === 'en' ? 'en' : 'es'
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const [reto, setReto] = useState<RetoPublico | null>(null)
  const [valor, setValor] = useState<(string | null)[]>([])
  const [fallos, setFallos] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    api
      .retoDeLugar(slug)
      .then((r) => {
        setReto(r as RetoPublico)
        setValor(respuestaInicial(r as RetoPublico, idioma))
      })
      .catch(() => setError(true))
  }, [slug, idioma])

  async function enviar(revelar: boolean) {
    setEnviando(true)
    try {
      const r = await api.completarReto(slug, valor.filter((v) => v !== null), revelar, idioma)
      if (r.completado) navigate(`/recompensa/${slug}`, { state: r })
      else setFallos((f) => f + 1)
    } catch {
      setError(true)
    } finally {
      setEnviando(false)
    }
  }

  if (error)
    return (
      <main className="reto">
        <p className="reto-aviso" role="alert">{t('reto.error')}</p>
        <Boton ancho onClick={() => navigate('/mapa')}>{t('reto.volver')}</Boton>
      </main>
    )
  if (!reto) return <main className="reto"><p role="status">{t('reto.cargando')}</p></main>

  const completo = valor.length > 0 && valor.every((v) => v !== null)
  const sinIntentos = fallos >= reto.intentos_max

  return (
    <>
      <Banderines cuerda />
      <main className="reto">
        <h1>{t('pantallas.reto')}</h1>
        <p className="reto-premio">{t('reto.premio', { n: reto.tlacos })}</p>
        <p className="reto-instrucciones">{t(`reto.instrucciones_${reto.tipo}`)}</p>

        {reto.tipo === 'palabras' ? (
          <JuegoPalabras contenido={reto[`contenido_${idioma}`]} valor={valor} onCambio={setValor} />
        ) : (
          <JuegoOrden contenido={reto[`contenido_${idioma}`]} valor={valor as string[]} onCambio={setValor} />
        )}

        {fallos > 0 && (
          <p className="reto-aviso" role="status">
            {sinIntentos ? t('reto.sinIntentos') : t('reto.incorrecto', { count: reto.intentos_max - fallos })}
          </p>
        )}

        <div className="reto-acciones">
          {!sinIntentos && (
            <Boton ancho disabled={!completo || enviando} onClick={() => enviar(false)}>
              {t('reto.comprobar')}
            </Boton>
          )}
          {fallos > 0 && (
            <Boton ancho variante="blanco" disabled={enviando} onClick={() => enviar(true)}>
              {t('reto.revelar', { n: reto.tlacos_revelado })}
            </Boton>
          )}
        </div>
      </main>
    </>
  )
}
