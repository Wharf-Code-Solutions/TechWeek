// Pantalla 14: Desliza para canjear · Responsable: Dev 3 (M10)
// El cupón lleva un sello giratorio y un reloj en vivo para que una captura de pantalla no sirva.
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { usePromociones } from '../app/datos'
import { useCampo } from '../app/idioma'
import Ilustracion from '../components/ui/Ilustracion'
import { guardarCupon, leerCupon, type CuponGuardado } from '../features/cartera/cuponGuardado'
import { ApiError, api } from '../lib/api'
import estilos from './Cupon.module.css'

const ASA = 57 // ancho del botón que se desliza (px)

// Ilustración grande de cada promoción (slug → nombre en el set).
const ILUSTRACION: Record<string, string> = {
  'cafe-2x1': 'cafe-lechero',
  volovan: 'volovan',
  nieve: 'nieve',
  'lancha-20': 'artesania',
}

function RelojEnVivo() {
  const { t, i18n } = useTranslation()
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <p className={estilos.reloj} aria-label={t('cupon.hora')}>
      {ahora.toLocaleTimeString(i18n.language, { hour12: false })}
    </p>
  )
}

export default function Cupon() {
  const { t } = useTranslation()
  const campo = useCampo()
  const navegar = useNavigate()
  const { id: slug = '' } = useParams()
  const promo = usePromociones().find((p) => p.slug === slug)

  const [cupon, setCupon] = useState<CuponGuardado | null>(() => leerCupon(slug))
  const [canjeando, setCanjeando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pista = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const [tope, setTope] = useState(0)
  // El relleno rosa acompaña a la perilla.
  const fondo = useTransform(x, (v) => v + ASA + 8)
  useEffect(() => {
    setTope(Math.max((pista.current?.clientWidth ?? 0) - ASA - 8, 0))
  }, [cupon])

  async function confirmar() {
    if (canjeando) return
    setCanjeando(true)
    setError(null)
    try {
      const r = await api.canjear(slug)
      const nuevo = { codigo: r.codigo, en: Date.now() }
      guardarCupon(slug, nuevo)
      setCupon(nuevo)
    } catch (e) {
      animate(x, 0)
      setError(
        e instanceof ApiError && e.status === 402
          ? t('cupon.saldo_insuficiente')
          : e instanceof ApiError && e.status === 404
            ? t('cupon.no_disponible')
            : t('comun.error'),
      )
    } finally {
      setCanjeando(false)
    }
  }

  const ilustracion = ILUSTRACION[slug] ?? 'moneda'

  return (
    <main className={estilos.pantalla}>
      <div className={estilos.barra}>
        <button type="button" className={estilos.volver} aria-label={t('cupon.volver')} onClick={() => navegar('/mapa')}>
          <CaretLeft size={22} weight="bold" aria-hidden="true" />
        </button>
        <span className={estilos.pildora}>{cupon ? t('cupon.valido') : t('cupon.muestraAlMesero')}</span>
      </div>
      <h1 className="solo-lectores">{cupon ? t('cupon.valido') : t('pantallas.cupon')}</h1>

      <div className={estilos.boleto}>
        {promo && (
          <>
            <span className={estilos.comercio}>{promo.comercio}</span>
            <strong className={estilos.nombre}>{campo(promo, 'titulo')}</strong>
            <span className={estilos.detalle}>{t('cartera.costo', { n: promo.costo_tlacos })}</span>
          </>
        )}
        <span className={estilos.corte} aria-hidden="true" />

        {cupon ? (
          <div className={estilos.valido}>
            <motion.div
              className={estilos.sello}
              aria-label={t('cupon.sello')}
              role="img"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            >
              <Ilustracion nombre="moneda" tamano={96} />
            </motion.div>
            <p>{t('cupon.muestralo')}</p>
            <span className={estilos.etiqueta}>{t('cupon.codigo')}</span>
            <strong className={estilos.codigo}>{cupon.codigo}</strong>
            <RelojEnVivo />
          </div>
        ) : (
          <>
            <span className={estilos.circulo}>
              <Ilustracion nombre={ilustracion} tamano={150} />
            </span>
            <p className={estilos.aviso}>
              <Trans i18nKey="cupon.aviso" components={{ b: <b /> }} />
            </p>
          </>
        )}
      </div>

      {error && (
        <p role="alert" className={estilos.error}>
          {error}
        </p>
      )}

      {!cupon && (
        <div ref={pista} className={estilos.pista}>
          <motion.span className={estilos.relleno} style={{ width: fondo }} aria-hidden="true" />
          <span className={estilos.texto}>{canjeando ? t('cupon.canjeando') : t('cupon.deslizar')} →</span>
          <motion.button
            type="button"
            className={estilos.asa}
            aria-label={t('cupon.confirmar')}
            style={{ x }}
            drag="x"
            dragConstraints={{ left: 0, right: tope }}
            dragElastic={0}
            dragMomentum={false}
            onDragEnd={() => (x.get() >= tope * 0.85 ? void confirmar() : animate(x, 0))}
            onKeyDown={(e) => {
              // Alternativa accesible al arrastre: Enter o espacio confirman.
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                void confirmar()
              }
            }}
          >
            <CaretRight size={26} weight="bold" aria-hidden="true" />
          </motion.button>
        </div>
      )}
    </main>
  )
}
