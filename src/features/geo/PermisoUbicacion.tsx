// Pantalla 02 · Permiso de ubicación / modo explorador.
// El permiso del navegador solo se pide cuando el turista toca "Permitir ubicación".
import { Crosshair, MapPin } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Boton from '../../components/ui/Boton'
import Tarjeta from '../../components/ui/Tarjeta'
import { activarDemo } from './demoStore'
import { activarExplorador } from './explorador'
import { useEstadoUbicacion } from './usePosition'
import estilos from './PermisoUbicacion.module.css'

interface Props {
  /** Se llama al conceder la ubicación o al elegir el modo explorador. */
  onListo: () => void
}

function Solicitando({ onListo }: Props) {
  const { t } = useTranslation()
  const estado = useEstadoUbicacion() // suscribirse al GPS dispara el aviso del navegador

  useEffect(() => {
    if (estado === 'concedido') onListo()
  }, [estado, onListo])

  if (estado === 'denegado' || estado === 'no-disponible') {
    return (
      <>
        <p role="alert">{t('permiso.denegado')}</p>
        <Boton
          ancho
          variante="amarillo"
          onClick={() => {
            activarExplorador()
            onListo()
          }}
        >
          {t('permiso.explorar')}
        </Boton>
      </>
    )
  }
  return <p role="status">{t('permiso.buscando')}</p>
}

export default function PermisoUbicacion({ onListo }: Props) {
  const { t } = useTranslation()
  const [pidiendo, setPidiendo] = useState(false)

  return (
    <Tarjeta className={estilos.tarjeta}>
      {/* Mientras no llegue la ilustración del pin con castillo del diseño, un pin rosa sobre círculo turquesa. */}
      <span className={estilos.pin} aria-hidden="true">
        <MapPin size={64} weight="fill" />
      </span>
      <h2 className={estilos.titulo}>{t('permiso.titulo')}</h2>
      <p>{t('permiso.texto')}</p>
      {pidiendo ? (
        <Solicitando onListo={onListo} />
      ) : (
        <>
          <Boton
            ancho
            onClick={() => {
              activarExplorador(false) // si antes eligió explorar, hay que volver a escuchar el GPS
              setPidiendo(true)
            }}
          >
            <Crosshair size={22} weight="bold" aria-hidden="true" />
            {t('permiso.permitir')}
          </Boton>
          <button
            type="button"
            className={estilos.enlace}
            onClick={() => {
              activarExplorador()
              onListo()
            }}
          >
            {t('permiso.explorar')}
          </button>
          <p className={estilos.aviso}>{t('permiso.aviso_explorador')}</p>
          {/* Para probar la app lejos del Centro (por ejemplo, en un hackatón): el recorrido virtual hace de GPS. */}
          <button
            type="button"
            className={estilos.enlace}
            onClick={() => {
              activarExplorador(false)
              activarDemo()
              onListo()
            }}
          >
            {t('permiso.demo')}
          </button>
        </>
      )}
    </Tarjeta>
  )
}
