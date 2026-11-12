// Pantalla: Reto · Responsable: Dev 2 (pantallas) · Dev 1 (validación). Diseño 06 (leyenda) y 07 (orden).
// Al completarse navega a /recompensa/:slug con el resultado de completarReto() en location.state.
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { X } from '@phosphor-icons/react'
import { api } from '../lib/api'
import Boton from '../components/ui/Boton'
import Ilustracion from '../components/ui/Ilustracion'
import { escenaDe } from '../components/ui/escenas'
import { urlIlustracion } from '../components/ui/ilustraciones'
import { useLugares } from '../app/datos'
import JuegoPalabras from '../features/retos/JuegoPalabras'
import JuegoOrden from '../features/retos/JuegoOrden'
import JuegoOpciones from '../features/retos/JuegoOpciones'
import { contenidoEn, esRapido, idiomaDelReto, opcionesRapido, respuestaInicial, type RetoPublico } from '../features/retos/logica'
import { idiomaDe } from '../app/idioma'
import '../features/retos/retos.css'


export default function Reto() {
  const { t, i18n } = useTranslation()
  const idiomaApp = idiomaDe(i18n.language)
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const [reto, setReto] = useState<RetoPublico | null>(null)
  const lugar = useLugares().find((l) => l.slug === slug)
  const [valor, setValor] = useState<(string | null)[]>([])
  const [parada, setParada] = useState<{ n: number; total: number } | null>(null)
  const [fallos, setFallos] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(false)
  const [yaVisitado, setYaVisitado] = useState(false)
  const [descartadas, setDescartadas] = useState<string[]>([]) // opciones rápidas ya probadas y falladas
  // Reto cerrado con "ver respuesta" (a mano o al agotar las vidas): se muestra la respuesta antes de seguir.
  const [revelada, setRevelada] = useState<Awaited<ReturnType<typeof api.completarReto>> | null>(null)
  const revelando = useRef(false)

  useEffect(() => {
    api
      .retoDeLugar(slug)
      .then((r) => {
        setReto(r as RetoPublico)
        setValor(respuestaInicial(r as RetoPublico, idiomaDelReto(r as RetoPublico, idiomaApp)))
      })
      .catch(() => setError(true))
  }, [slug, idiomaApp])
  // El contenido se juega en el idioma de la app; si el reto aún no está en francés, en inglés.
  const idioma = reto ? idiomaDelReto(reto, idiomaApp) : idiomaApp

  // "Parada 2 de 5" si el lugar está en la ruta activa; sin ruta no se muestra.
  useEffect(() => {
    api
      .rutaActual()
      .then((r) => {
        const i = r.lugares.findIndex((l) => l.slug === slug)
        if (i >= 0) setParada({ n: i + 1, total: r.lugares.length })
      })
      .catch(() => {})
  }, [slug])

  async function enviar(revelar: boolean, respuesta?: string[]) {
    setEnviando(true)
    try {
      const r = await api.completarReto(slug, respuesta ?? valor.filter((v) => v !== null), revelar, idioma)
      if (r.ya_visitado) setYaVisitado(true)
      else if (r.completado && !r.correcto) setRevelada(r)
      else if (r.completado) navigate(`/recompensa/${slug}`, { state: r })
      else {
        setFallos((f) => f + 1)
        if (respuesta) setDescartadas((d) => [...d, ...respuesta])
      }
    } catch {
      setError(true)
    } finally {
      setEnviando(false)
    }
  }

  // Al agotar las vidas se revela sola la respuesta (paga los doblones de "ver respuesta") y se muestra.
  useEffect(() => {
    if (!reto || fallos === 0 || fallos < reto.intentos_max || revelada || revelando.current) return
    revelando.current = true
    void enviar(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe dispararse al cambiar los fallos
  }, [fallos, reto])

  if (yaVisitado)
    return (
      <main className="reto reto--palabras">
        <div className="reto-cuerpo">
          <p className="reto-aviso" role="status">{t('lugar.ya_visitado')}</p>
          <Boton ancho onClick={() => navigate('/mapa')}>{t('reto.volver')}</Boton>
        </div>
      </main>
    )
  if (error)
    return (
      <main className="reto reto--palabras">
        <div className="reto-cuerpo">
          <p className="reto-aviso" role="alert">{t('reto.error')}</p>
          <Boton ancho onClick={() => navigate('/mapa')}>{t('reto.volver')}</Boton>
        </div>
      </main>
    )
  if (!reto)
    return (
      <main className="reto reto--palabras">
        <p className="reto-cuerpo" role="status">{t('reto.cargando')}</p>
      </main>
    )

  const completo = valor.length > 0 && valor.every((v) => v !== null)
  const quedan = Math.max(reto.intentos_max - fallos, 0)
  const sinIntentos = quedan === 0
  // Texto legible de la respuesta correcta (verdadero/falso se traduce).
  const correcta = (revelada?.respuesta_correcta ?? []).map((r) =>
    reto.tipo === 'verdadero_falso' ? t(`reto.${r}`) : r,
  )

  return (
    <main className={`reto reto--${reto.tipo}`}>
      <div className="reto-escena" style={{ backgroundImage: `url("${urlIlustracion(escenaDe(lugar?.categoria))}")` }}>
        <div className="reto-barra">
          <Link to="/mapa" className="reto-salir" aria-label={t('reto.salir')}>
            <X size={20} weight="bold" aria-hidden="true" />
          </Link>
          <span className="reto-pastilla">
            {reto.tipo === 'orden' && parada ? (
              t('reto.paradaPremio', { n: parada.n, total: parada.total, tlacos: reto.tlacos })
            ) : (
              <>
                <Ilustracion nombre="moneda" tamano={20} />
                {t('reto.mas', { n: reto.tlacos })}
              </>
            )}
          </span>
        </div>
      </div>

      <div className="reto-cuerpo">
        <div>
          {reto.tipo !== 'orden' && (
            <span className="reto-antetitulo">
              {parada ? t('reto.minijuegoParada', { n: parada.n, total: parada.total }) : t('reto.minijuego')}
            </span>
          )}
          <h1>{t(`reto.titulo_${reto.tipo}`)}</h1>
          <p className="reto-instrucciones">{t(`reto.instrucciones_${reto.tipo}`)}</p>
        </div>

        {reto.tipo === 'palabras' ? (
          <JuegoPalabras contenido={contenidoEn(reto.contenido_es, reto.contenido_en, reto.contenido_fr, idioma)} valor={valor} onCambio={setValor} />
        ) : reto.tipo === 'orden' ? (
          <JuegoOrden contenido={contenidoEn(reto.contenido_es, reto.contenido_en, reto.contenido_fr, idioma)} valor={valor as string[]} onCambio={setValor} />
        ) : (
          <JuegoOpciones
            enunciado={opcionesRapido(reto, idioma)?.enunciado ?? ''}
            opciones={(opcionesRapido(reto, idioma)?.opciones ?? []).map((id) => ({
              id,
              texto: reto.tipo === 'verdadero_falso' ? t(`reto.${id}`) : id,
            }))}
            descartadas={descartadas}
            deshabilitado={enviando || sinIntentos}
            pareja={reto.tipo === 'verdadero_falso'}
            onElegir={(id) => void enviar(false, [id])}
          />
        )}
      </div>

      <div className="reto-pie">
        {revelada ? (
          <>
            <div className="reto-respuesta" role="status">
              <span className="reto-respuesta-titulo">{t('reto.respuestaEra')}</span>
              {reto.tipo === 'orden' ? (
                <ol>
                  {correcta.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ol>
              ) : (
                <strong>{correcta.join(' · ')}</strong>
              )}
            </div>
            <Boton ancho onClick={() => navigate(`/recompensa/${slug}`, { state: revelada })}>
              {t('reto.seguirRecompensa', { n: revelada.tlacos_ganados })}
            </Boton>
          </>
        ) : (
          <>
        <p className="reto-intentos" aria-label={t('reto.quedan', { count: quedan })}>
          <span aria-hidden="true">{t('reto.intentos')}</span>
          <span className="reto-corazones" aria-hidden="true">
            {'♥'.repeat(quedan)}
            <span className="reto-corazones-perdidos">{'♥'.repeat(reto.intentos_max - quedan)}</span>
          </span>
        </p>
        {fallos > 0 && (
          <p className="reto-aviso" role="status">
            {sinIntentos ? t('reto.sinIntentos') : t('reto.incorrecto', { count: quedan })}
          </p>
        )}
        {!sinIntentos && !esRapido(reto.tipo) && (
          <button type="button" className="reto-comprobar" disabled={!completo || enviando} onClick={() => enviar(false)}>
            {t(`reto.comprobar_${reto.tipo}`)}
          </button>
        )}
        {fallos > 0 && (
          <Boton ancho variante="blanco" disabled={enviando} onClick={() => enviar(true)}>
            {t('reto.revelar', { n: reto.tlacos_revelado })}
          </Boton>
        )}
          </>
        )}
      </div>
    </main>
  )
}
