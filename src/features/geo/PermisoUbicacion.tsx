// Pantalla 02 · Permiso de ubicación / modo explorador.
// El permiso del navegador solo se pide cuando el turista acepta el aviso de privacidad y toca "Permitir ubicación".
// Aviso de privacidad simplificado conforme a la Ley Federal de Protección de Datos Personales en Posesión de los
// Particulares (LFPDPPP): quién trata los datos, para qué, y cómo negarse; sin datos que identifiquen a la persona.
import { Check, Crosshair, MapPin } from '@phosphor-icons/react'
import { useEffect, useId, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import Boton from '../../components/ui/Boton'
import Tarjeta from '../../components/ui/Tarjeta'
import { activarExplorador } from './explorador'
import { useEstadoUbicacion } from './usePosition'
import estilos from './PermisoUbicacion.module.css'

/** Versión del aviso aceptado: si el texto cambia de fondo, se sube y se vuelve a pedir. */
const CLAVE_ACEPTO = 'jarana.aviso.v1'

const leerAcepto = () => {
  try {
    return localStorage.getItem(CLAVE_ACEPTO) === '1'
  } catch {
    return false
  }
}

const guardarAcepto = (si: boolean) => {
  try {
    if (si) localStorage.setItem(CLAVE_ACEPTO, '1')
    else localStorage.removeItem(CLAVE_ACEPTO)
  } catch {
    /* sin almacenamiento: se vuelve a preguntar la próxima vez */
  }
}

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
  const [acepto, setAcepto] = useState(leerAcepto)
  const [verAviso, setVerAviso] = useState(false)
  const idAviso = useId()

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
          <div className={estilos.acepto}>
            <label className={estilos.casilla}>
              <input
                type="checkbox"
                checked={acepto}
                onChange={(e) => {
                  setAcepto(e.target.checked)
                  guardarAcepto(e.target.checked)
                }}
              />
              <span className={estilos.caja} aria-hidden="true">
                <Check size={16} weight="bold" />
              </span>
              <span>
                <Trans
                  i18nKey="permiso.acepto"
                  components={{
                    aviso: (
                      <button
                        type="button"
                        className={estilos.enlaceAviso}
                        aria-expanded={verAviso}
                        aria-controls={idAviso}
                        onClick={(e) => {
                          e.preventDefault() // no marcar la casilla al abrir el aviso
                          setVerAviso((v) => !v)
                        }}
                      />
                    ),
                  }}
                />
              </span>
            </label>
            {verAviso && (
              <div id={idAviso} className={estilos.aviso_privacidad}>
                <strong>{t('permiso.aviso_titulo')}</strong>
                <p>{t('permiso.aviso_texto')}</p>
                <p>{t('permiso.terminos_texto')}</p>
              </div>
            )}
          </div>
          <Boton
            ancho
            disabled={!acepto}
            onClick={() => {
              if (!acepto) return
              activarExplorador(false) // si antes eligió explorar, hay que volver a escuchar el GPS
              setPidiendo(true)
            }}
          >
            <Crosshair size={22} weight="bold" aria-hidden="true" />
            {t('permiso.permitir')}
          </Boton>
          {!acepto && <p className={estilos.aviso}>{t('permiso.falta_aceptar')}</p>}
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
        </>
      )}
    </Tarjeta>
  )
}
