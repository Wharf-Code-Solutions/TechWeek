// Pantalla: Mapa · Responsable: Dev 2 (M4, M7)
import { useTranslation } from 'react-i18next'
import { MapaLugares } from '../features/mapa'

export default function Mapa() {
  const { t } = useTranslation()
  return (
    <main>
      <h1 className="solo-lectores">{t('pantallas.mapa')}</h1>
      <MapaLugares />
    </main>
  )
}
