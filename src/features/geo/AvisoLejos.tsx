// Aviso en el mapa: si el GPS dice que el turista está lejos del Centro, ofrece el recorrido virtual (modo demo)
// para poder probar los lugares y los minijuegos sin estar allí. Se puede descartar.
import { Footprints } from '@phosphor-icons/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Boton from '../../components/ui/Boton'
import { cargarPreferencias } from '../../app/preferencias'
import { api } from '../../lib/api'
import { estaLejosDelCentro } from './centro'
import { activarDemo } from './demoStore'
import { usePosition } from './usePosition'
import estilos from './AvisoLejos.module.css'

export default function AvisoLejos() {
  const { t } = useTranslation()
  const pos = usePosition()
  const [oculto, setOculto] = useState(false)
  const [activando, setActivando] = useState(false)

  if (oculto || !pos || pos.fuente !== 'gps' || !estaLejosDelCentro(pos)) return null

  // La ruta de la demo (las 5 paradas del guion) se crea en el servidor y se recarga la pantalla ya en modo demo.
  async function probar() {
    setActivando(true)
    activarDemo()
    try {
      const { tiempoMin, intereses } = cargarPreferencias()
      await api.crearRuta({ tiempo_min: tiempoMin, intereses, demo: true })
    } finally {
      window.location.reload()
    }
  }

  return (
    <div className={estilos.aviso} role="status">
      <Footprints size={28} weight="duotone" aria-hidden="true" />
      <p>{t('mapa.lejos')}</p>
      <div className={estilos.botones}>
        <Boton variante="amarillo" disabled={activando} onClick={() => void probar()}>
          {t('mapa.lejos_activar')}
        </Boton>
        <Boton variante="blanco" disabled={activando} onClick={() => setOculto(true)}>
          {t('mapa.lejos_cerrar')}
        </Boton>
      </div>
    </div>
  )
}
