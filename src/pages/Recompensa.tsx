// Pantalla 08: Recompensa · Responsable: Dev 3
// Contrato con la pantalla de reto (Dev 2): navegar con
//   navigate(`/recompensa/${slug}`, { state: { tlacos_ganados, saldo } })
// usando la respuesta de api.completarReto. Sin state se consulta el saldo.
import { animate } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLugares } from '../app/datos'
import { useCampo } from '../app/idioma'
import Banderines from '../components/ui/Banderines'
import Boton from '../components/ui/Boton'
import Ilustracion from '../components/ui/Ilustracion'
import Tarjeta from '../components/ui/Tarjeta'
import { api } from '../lib/api'
import estilos from './Recompensa.module.css'

interface EstadoRecompensa {
  tlacos_ganados?: number
  saldo?: number
}

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
  const lugar = useLugares().find((l) => l.slug === slug)

  const [saldo, setSaldo] = useState<number | null>(estado.saldo ?? null)
  useEffect(() => {
    if (estado.saldo !== undefined) return
    api
      .saldo()
      .then((r) => setSaldo(r.saldo))
      .catch(() => {})
  }, [estado.saldo])

  const ganados = estado.tlacos_ganados ?? 0
  const contador = useContador(ganados)

  return (
    <main className={estilos.pantalla}>
      <Banderines cuerda />
      <div className={estilos.contenido}>
        <h1 className={estilos.titulo}>
          {ganados > 0 ? t('recompensa.ganaste', { n: contador }) : t('recompensa.completado')}
        </h1>

        <Tarjeta className={estilos.premios}>
          {lugar && (
            <div className={estilos.premio}>
              <Ilustracion nombre={lugar.ilustracion} tamano={72} />
              <div>
                <strong>{t('recompensa.sello')}</strong>
                <p>{campo(lugar, 'nombre')}</p>
              </div>
            </div>
          )}
          <div className={estilos.premio}>
            <Ilustracion nombre="puzzle" tamano={72} />
            <div>
              <strong>{t('recompensa.pieza')}</strong>
            </div>
          </div>
          {saldo !== null && <p className={estilos.saldo}>{t('recompensa.saldo', { n: saldo })}</p>}
        </Tarjeta>

        <Boton ancho onClick={() => navegar('/mapa')}>
          {t('recompensa.seguir')}
        </Boton>
      </div>
    </main>
  )
}
