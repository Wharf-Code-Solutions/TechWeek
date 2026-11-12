// Botón "Compartir mi ruta": genera la imagen, abre el menú del celular y, si la ruta ya terminó,
// pide los +30 doblones (una vez por ruta; el servidor no puede verificar que se compartió).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShareNetwork } from '@phosphor-icons/react'
import { api } from '../../lib/api'
import { compartirImagen } from './compartir'
import { generarImagen } from './imagen'
import type { DatosCompartir } from './texto'
import './compartir.css'

interface Props {
  datos: DatosCompartir
  /** Id de la ruta terminada; sin él (o sin terminar) se comparte pero no hay doblones. */
  rutaId: number | null
  terminada: boolean
  className?: string
}

export default function BotonCompartir({ datos, rutaId, terminada, className = '' }: Props) {
  const { t } = useTranslation()
  const [trabajando, setTrabajando] = useState(false)
  const [mensaje, setMensaje] = useState<{ texto: string; error?: boolean } | null>(null)

  async function compartir() {
    setTrabajando(true)
    setMensaje(null)
    try {
      const imagen = await generarImagen(datos, {
        logrado: t('fin.logrado'),
        paradas: t('compartir.lugares', { count: datos.paradas }),
        tlacos: t('compartir.tlacos'),
        distancia: t('compartir.caminados'),
        piezas: t('pasaporte.piezas', { n: datos.piezas.ganadas, total: datos.piezas.total }),
        pie: t('compartir.pie'),
      })
      const texto = t('compartir.texto', { n: datos.paradas, url: window.location.origin })
      const resultado = await compartirImagen(imagen, texto)

      let aviso = resultado === 'descargado' ? t('compartir.descargada') : ''
      if (rutaId !== null && terminada) {
        const r = await api.compartirRuta(rutaId)
        aviso = r.tlacos > 0 ? t('compartir.ganaste', { n: r.tlacos }) : aviso || t('compartir.yaCobrado')
      }
      if (aviso) setMensaje({ texto: aviso })
    } catch {
      setMensaje({ texto: t('compartir.error'), error: true })
    } finally {
      setTrabajando(false)
    }
  }

  return (
    <div className="compartir">
      <button type="button" className={`compartir-boton ${className}`} onClick={() => void compartir()} disabled={trabajando}>
        <ShareNetwork size={22} weight="duotone" aria-hidden="true" />
        {trabajando ? t('compartir.preparando') : t('compartir.boton')}
      </button>
      {terminada && rutaId !== null && <small className="compartir-nota">{t('compartir.premio')}</small>}
      {mensaje && (
        <p className="compartir-mensaje" role={mensaje.error ? 'alert' : 'status'}>
          {mensaje.texto}
        </p>
      )}
    </div>
  )
}
