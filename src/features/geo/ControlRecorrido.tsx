// M6 · Recorrido virtual (?demo=1): píldora y cronómetro arriba, panel con "Avanzar" abajo.
// Solo se muestra en modo demo. Dev 2: móntalo sobre el mapa (Mapa.tsx): <ControlRecorrido />
// y oculta tu panel/botones inferiores cuando esModoDemo() para que no se encimen.
import { ArrowUp, CaretLeft, CaretRight, PlayCircle, SkipForward } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCampo } from '../../app/idioma'
import Boton from '../../components/ui/Boton'
import { esModoDemo, useRecorridoDemo } from './demoStore'
import { anguloRelativo, rumboHacia } from './recorridoVirtual'
import { RECORRIDO_DEMO } from './rutaDemo'
import estilos from './ControlRecorrido.module.css'

const DEMO_SEG = 4 * 60 // la demo dura 4 minutos
const CLAVE_INICIO = 'jarana.demo.inicio'
const PASO_CAMINANDO_M = 6
const ESPERA_CAMINAR_MS = 350
const CADA_PASO_MS = 120

/** Segundos que quedan de la demo. El reloj arranca la primera vez que se muestra el control. */
function useCronometro() {
  const [ahora, setAhora] = useState(() => Date.now())
  const [inicio] = useState(() => {
    try {
      const guardado = Number(sessionStorage.getItem(CLAVE_INICIO))
      if (guardado) return guardado
      const nuevo = Date.now()
      sessionStorage.setItem(CLAVE_INICIO, String(nuevo))
      return nuevo
    } catch {
      return Date.now()
    }
  })
  useEffect(() => {
    const id = window.setInterval(() => setAhora(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return Math.max(0, DEMO_SEG - Math.floor((ahora - inicio) / 1000))
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function Controles() {
  const { t } = useTranslation()
  const campo = useCampo()
  const r = useRecorridoDemo()
  const quedan = useCronometro()

  const ultima = r.paradas.length - 1
  const sigIdx = Math.min(r.parada + 1, ultima)
  const siguiente = r.paradas[sigIdx]
  const terminada = r.parada >= ultima
  const faltan = Math.max(0, Math.round(RECORRIDO_DEMO.metrosDeParada(sigIdx) - r.metros))
  // Flecha hacia la siguiente parada: como el mapa gira con el personaje, "arriba" es hacia donde mira.
  const giro = Math.round(anguloRelativo(r.rumbo, rumboHacia(r, siguiente)))

  // Tocar da un paso; mantener presionado camina hasta soltar.
  const espera = useRef<number | undefined>(undefined)
  const caminando = useRef<number | undefined>(undefined)
  const parar = () => {
    window.clearTimeout(espera.current)
    window.clearInterval(caminando.current)
  }
  useEffect(() => parar, [])
  const empezar = () => {
    parar()
    r.avanzar()
    espera.current = window.setTimeout(() => {
      caminando.current = window.setInterval(() => r.avanzar(PASO_CAMINANDO_M), CADA_PASO_MS)
    }, ESPERA_CAMINAR_MS)
  }

  return (
    <>
      <div className={estilos.superior}>
        <span className={estilos.pildora}>
          <PlayCircle size={20} weight="fill" aria-hidden="true" />
          {t('recorrido.etiqueta')}
        </span>
        <span className={estilos.cronometro} role="timer" aria-label={t('recorrido.demo', { tiempo: mmss(quedan) })}>
          {t('recorrido.demo', { tiempo: mmss(quedan) })}
        </span>
      </div>

      <div className={estilos.panel} role="group" aria-label={t('recorrido.etiqueta')}>
        <div className={estilos.cabecera}>
          {!terminada && (
            <span className={estilos.flecha} role="img" aria-label={t('recorrido.direccion', { grados: giro })}>
              <ArrowUp size={22} weight="bold" style={{ transform: `rotate(${giro}deg)`, transition: 'transform 0.4s' }} />
            </span>
          )}
          <strong role="status">
            {terminada
              ? t('recorrido.completo')
              : t('recorrido.siguiente_parada', {
                  nombre: campo(siguiente, 'nombre'),
                  n: sigIdx,
                  total: ultima,
                })}
          </strong>
          {!terminada && <span className={estilos.distancia}>{t('recorrido.distancia', { m: faltan })}</span>}
        </div>

        <div
          className={estilos.barra}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((r.metros / r.totalM) * 100)}
        >
          <span style={{ width: `${(r.metros / r.totalM) * 100}%` }} />
        </div>

        <div className={estilos.botones}>
          <Boton variante="blanco" aria-label={t('recorrido.retroceder')} onClick={() => r.retroceder()}>
            <CaretLeft weight="bold" size={24} aria-hidden="true" />
          </Boton>
          <Boton
            ancho
            className={estilos.avanzar}
            disabled={terminada}
            onPointerDown={empezar}
            onPointerUp={parar}
            onPointerLeave={parar}
            onPointerCancel={parar}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                r.avanzar()
              }
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {t('recorrido.avanzar')}
            <CaretRight weight="bold" size={20} aria-hidden="true" />
          </Boton>
          <Boton
            variante="amarillo"
            aria-label={t('recorrido.saltar_parada')}
            disabled={terminada}
            onClick={() => r.irAParada(sigIdx)}
          >
            <SkipForward weight="duotone" size={24} aria-hidden="true" />
          </Boton>
        </div>

        <p className={estilos.ayuda}>{t('recorrido.ayuda')}</p>
      </div>
    </>
  )
}

export default function ControlRecorrido() {
  return esModoDemo() ? <Controles /> : null
}
