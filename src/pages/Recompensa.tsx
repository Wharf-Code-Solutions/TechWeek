// Pantalla 08: Recompensa · Responsable: Dev 3. Diseño 08: fondo tinta, moneda grande y accesos al pasaporte.
// Contrato con la pantalla de reto (Dev 2): navegar con
//   navigate(`/recompensa/${slug}`, { state: { tlacos_ganados, saldo } })
// usando la respuesta de api.completarReto. Sin state se consulta el saldo.
import { animate, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLugares } from '../app/datos'
import { useCampo } from '../app/idioma'
import Banderines from '../components/ui/Banderines'
import Boton from '../components/ui/Boton'
import Ilustracion from '../components/ui/Ilustracion'
import Rompecabezas from '../features/pasaporte/Rompecabezas'
import type { PasaporteDatos } from '../features/pasaporte/tipos'
import { api } from '../lib/api'
import estilos from './Recompensa.module.css'

interface EstadoRecompensa {
  tlacos_ganados?: number
  saldo?: number
}

const TINTA = '#150A2E'

/** Cuenta de 0 al valor final; respeta "reducir movimiento". */
function useContador(final: number) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducido || final === 0) {
      setN(final)
      return
    }
    const control = animate(0, final, { duration: 0.9, onUpdate: (v) => setN(Math.round(v)) })
    return () => control.stop()
  }, [final])
  return n
}

export default function Recompensa() {
  const { t } = useTranslation()
  const campo = useCampo()
  const navegar = useNavigate()
  const { slug } = useParams()
  const estado = (useLocation().state ?? {}) as EstadoRecompensa
  const todos = useLugares()
  const lugar = todos.find((l) => l.slug === slug)

  const [saldo, setSaldo] = useState<number | null>(estado.saldo ?? null)
  const [pasaporte, setPasaporte] = useState<PasaporteDatos | null>(null)
  const [siguiente, setSiguiente] = useState<string | null>(null)

  useEffect(() => {
    if (estado.saldo !== undefined) return
    api
      .saldo()
      .then((r) => setSaldo(r.saldo))
      .catch(() => {})
  }, [estado.saldo])

  // Pieza n de N y siguiente parada: adornos; si fallan, la pantalla se ve igual con textos genéricos.
  useEffect(() => {
    let vivo = true
    api
      .pasaporte()
      .then((p) => vivo && setPasaporte(p as PasaporteDatos))
      .catch(() => {})
    api
      .rutaActual()
      .then((r) => {
        const i = r.lugares.findIndex((l) => l.slug === slug)
        const sig = i >= 0 ? r.lugares[i + 1] : undefined
        if (vivo && sig) setSiguiente(sig.slug)
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [slug])

  const ganados = estado.tlacos_ganados ?? 0
  const contador = useContador(ganados)
  const sigLugar = todos.find((l) => l.slug === siguiente)
  const nombre = lugar ? campo(lugar, 'nombre') : ''
  const esLeyenda = lugar?.categoria === 'leyendas'

  const piezas = pasaporte?.piezas ?? null
  const reducido = useReducedMotion()
  // El sello se estampa primero y la pieza cae después, para que se vean los dos premios por separado.
  const RETRASO_SELLO = 0.5
  const RETRASO_PIEZA = 1.3

  const alPasaporte = () => navegar('/mapa', { state: { pestana: 'pasaporte' } })

  return (
    <main className={estilos.pantalla}>
      <Banderines fondo={TINTA} />
      <div className={estilos.contenido}>
        <div className={estilos.moneda}>
          <Ilustracion nombre="moneda" tamano={190} />
          {ganados > 0 && <span className={estilos.monto}>{t('recompensa.monto', { n: contador })}</span>}
        </div>

        <h1 className={estilos.titulo}>{esLeyenda ? t('recompensa.leyenda') : t('recompensa.desbloqueado')}</h1>
        <p className={estilos.texto}>
          {ganados > 0
            ? t('recompensa.detalle', { n: ganados, lugar: nombre })
            : t('recompensa.detalleSinTlacos', { lugar: nombre })}
        </p>
        {saldo !== null && <p className={estilos.saldo}>{t('recompensa.saldo', { n: saldo })}</p>}

        <div className={estilos.premios}>
          <button type="button" className={estilos.premio} onClick={alPasaporte}>
            {/* Sello que se estampa: llega grande y girado, golpea la página y rebota */}
            <motion.span
              className={estilos.sello}
              initial={reducido ? false : { scale: 2.8, rotate: -40, opacity: 0 }}
              animate={{ scale: 1, rotate: -8, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 15, delay: RETRASO_SELLO }}
            >
              {lugar && <Ilustracion nombre={lugar.ilustracion} tamano={64} />}
              {!reducido && (
                <motion.span
                  className={estilos.onda}
                  aria-hidden="true"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.9, opacity: 0 }}
                  transition={{ duration: 0.7, delay: RETRASO_SELLO + 0.35, ease: 'easeOut' }}
                />
              )}
            </motion.span>
            <span className={estilos.etiqueta}>{t('recompensa.selloNuevo')}</span>
          </button>

          <button type="button" className={estilos.premio} onClick={alPasaporte}>
            <span className={estilos.rompe}>
              {piezas ? (
                <Rompecabezas
                  piezas={piezas}
                  url={pasaporte?.foto?.url || null}
                  nueva={piezas.ganadas > 0 ? piezas.ganadas - 1 : null}
                  retraso={RETRASO_PIEZA}
                />
              ) : (
                <Ilustracion nombre="puzzle" tamano={64} />
              )}
            </span>
            <span className={estilos.etiqueta}>
              {piezas ? t('recompensa.piezaDe', { n: piezas.ganadas, total: piezas.total }) : t('recompensa.pieza')}
            </span>
          </button>
        </div>

        <Boton ancho onClick={() => navegar('/mapa')}>
          {sigLugar ? t('recompensa.siguienteParada', { lugar: campo(sigLugar, 'nombre') }) : t('recompensa.seguir')}
        </Boton>
      </div>
    </main>
  )
}
