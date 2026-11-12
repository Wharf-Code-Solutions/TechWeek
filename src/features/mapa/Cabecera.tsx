// M4 · Cabecera del mapa (diseño 03): avatar → pasaporte, progreso de la ruta, saldo → cartera.
import { useTranslation } from 'react-i18next'
import Ilustracion from '../../components/ui/Ilustracion'
import './mapa.css'

interface Props {
  /** Nombre de la ilustración del avatar (avatar-flor, avatar-sombrero…). */
  avatar: string
  /** Texto de la ruta ("Ruta de Leyendas"); null si no hay ruta activa. */
  nombreRuta: string | null
  completados: number
  total: number
  saldo: number | null
  onAvatar: () => void
  onSaldo: () => void
}

export default function Cabecera({ avatar, nombreRuta, completados, total, saldo, onAvatar, onSaldo }: Props) {
  const { t } = useTranslation()
  const pct = total ? Math.round((completados / total) * 100) : 0
  return (
    <div className="cabecera">
      <button type="button" className="cabecera-avatar" aria-label={t('mapa.avatar')} onClick={onAvatar}>
        <Ilustracion nombre={avatar} tamano={44} />
      </button>
      <div className="cabecera-ruta">
        {nombreRuta ? (
          <>
            <span>{t('mapa.progreso', { ruta: nombreRuta, n: Math.min(completados + 1, total), total })}</span>
            <div
              className="cabecera-barra"
              role="progressbar"
              aria-label={t('mapa.completadas', { n: completados, total })}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={completados}
            >
              <div style={{ width: `${pct}%` }} />
            </div>
          </>
        ) : (
          <span>{t('mapa.explora')}</span>
        )}
      </div>
      <button
        type="button"
        className="cabecera-saldo"
        aria-label={t('mapa.saldo', { n: saldo ?? 0 })}
        onClick={onSaldo}
      >
        <Ilustracion nombre="moneda" tamano={24} />
        {saldo ?? '–'}
      </button>
    </div>
  )
}
