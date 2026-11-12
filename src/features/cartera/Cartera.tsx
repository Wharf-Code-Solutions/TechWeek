// M10 · Cartera: saldo de Tlacos y promociones para canjear. Es el contenido de la pestaña
// "Cartera" del panel deslizable (M7, Dev 2).
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { usePromociones } from '../../app/datos'
import { useCampo } from '../../app/idioma'
import Boton from '../../components/ui/Boton'
import Tarjeta from '../../components/ui/Tarjeta'
import { api } from '../../lib/api'
import estilos from './Cartera.module.css'

export default function Cartera() {
  const { t } = useTranslation()
  const campo = useCampo()
  const navegar = useNavigate()
  const promos = usePromociones()
  const [saldo, setSaldo] = useState<number | null>(null)
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    let vivo = true
    api
      .saldo()
      .then((r) => vivo && setSaldo(r.saldo))
      .catch(() => vivo && setFallo(true))
    return () => {
      vivo = false
    }
  }, [])

  return (
    <section className={estilos.cartera} aria-labelledby="titulo-cartera">
      <h2 id="titulo-cartera" className={estilos.titulo}>
        {t('cartera.titulo')}
      </h2>
      <Tarjeta className={estilos.saldo}>
        {fallo ? (
          <p role="alert">{t('cartera.sin_saldo')}</p>
        ) : saldo === null ? (
          <p role="status">{t('comun.cargando')}</p>
        ) : (
          <strong className={estilos.cifra}>{t('cartera.saldo', { n: saldo })}</strong>
        )}
      </Tarjeta>

      <h3 className={estilos.subtitulo}>{t('cartera.promos')}</h3>
      <ul className={estilos.lista}>
        {promos.map((p) => {
          const falta = saldo === null ? p.costo_tlacos : Math.max(p.costo_tlacos - saldo, 0)
          return (
            <li key={p.slug}>
              <Tarjeta className={estilos.promo}>
                <div>
                  <strong>{campo(p, 'titulo')}</strong>
                  <p className={estilos.detalle}>
                    {p.comercio} · {t('cartera.costo', { n: p.costo_tlacos })}
                  </p>
                  {falta > 0 && saldo !== null && (
                    <p className={estilos.detalle}>{t('cartera.faltan', { n: falta })}</p>
                  )}
                </div>
                <Boton
                  variante="amarillo"
                  disabled={saldo === null || falta > 0}
                  onClick={() => navegar(`/cupon/${p.slug}`)}
                >
                  {t('cartera.canjear')}
                </Boton>
              </Tarjeta>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
