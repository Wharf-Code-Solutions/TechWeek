// Pantalla 02 · Permiso de ubicación / modo explorador.
// El permiso del navegador solo se pide cuando el turista toca "Permitir ubicación".
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Boton from '../../components/ui/Boton'
import Tarjeta from '../../components/ui/Tarjeta'
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
      <h2 className={estilos.titulo}>{t('permiso.titulo')}</h2>
      <p>{t('permiso.texto')}</p>
      {pidiendo ? (
        <Solicitando onListo={onListo} />
      ) : (
        <>
          <Boton ancho onClick={() => setPidiendo(true)}>
            {t('permiso.permitir')}
          </Boton>
          <Boton
            ancho
            variante="blanco"
            onClick={() => {
              activarExplorador()
              onListo()
            }}
          >
            {t('permiso.explorar')}
          </Boton>
          <p className={estilos.aviso}>{t('permiso.aviso_explorador')}</p>
        </>
      )}
    </Tarjeta>
  )
}
