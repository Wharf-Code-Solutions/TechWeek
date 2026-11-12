// Pantalla 14: Desliza para canjear · Responsable: Dev 3 (M10)
// El cupón lleva un sello giratorio y un reloj en vivo para que una captura de pantalla no sirva.
import { animate, motion, useMotionValue } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { usePromociones } from '../app/datos'
import { useCampo } from '../app/idioma'
import Banderines from '../components/ui/Banderines'
import Boton from '../components/ui/Boton'
import Ilustracion from '../components/ui/Ilustracion'
import Tarjeta from '../components/ui/Tarjeta'
import { guardarCupon, leerCupon, type CuponGuardado } from '../features/cartera/cuponGuardado'
import { ApiError, api } from '../lib/api'
import estilos from './Cupon.module.css'

const ASA = 56 // ancho del botón que se desliza (px)

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

  return (
    <main className={estilos.pantalla}>
      <Banderines cuerda />
      <div className={estilos.contenido}>
        <h1 className={estilos.titulo}>{cupon ? t('cupon.valido') : t('pantallas.cupon')}</h1>

        {promo && (
          <Tarjeta className={estilos.promo}>
            <strong className={estilos.nombre}>{campo(promo, 'titulo')}</strong>
            <p>{promo.comercio}</p>
            <p>{t('cartera.costo', { n: promo.costo_tlacos })}</p>
          </Tarjeta>
        )}

        {cupon ? (
          <Tarjeta className={estilos.cupon}>
            <motion.div
              className={estilos.sello}
              aria-label={t('cupon.sello')}
              role="img"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            >
              <Ilustracion nombre="moneda" tamano={72} />
            </motion.div>
            <p>{t('cupon.muestralo')}</p>
            <p className={estilos.etiqueta}>{t('cupon.codigo')}</p>
            <strong className={estilos.codigo}>{cupon.codigo}</strong>
            <RelojEnVivo />
          </Tarjeta>
        ) : (
          <div ref={pista} className={estilos.pista}>
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
              →
            </motion.button>
          </div>
        )}

        {error && <p role="alert">{error}</p>}

        <Boton ancho variante="blanco" onClick={() => navegar('/mapa')}>
          {t('cupon.volver')}
        </Boton>
      </div>
    </main>
  )
}
