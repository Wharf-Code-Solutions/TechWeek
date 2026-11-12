// Pantalla: Mapa · Responsable: Dev 2 (M4, M7)
import { useTranslation } from 'react-i18next'
import { useLugares } from '../app/datos'
import { MapaLugares, Panel } from '../features/mapa'
import ControlRecorrido from '../features/geo/ControlRecorrido'
import { useIrAlLlegar } from '../features/geo/useIrAlLlegar'

export default function Mapa() {
  const { t } = useTranslation()
  const lugares = useLugares()
  // shortcut: vigila todos los lugares; cambiar por los de la ruta cuando exista M3 (Dev 1).
  useIrAlLlegar(lugares)
  return (
    <main>
      <h1 className="solo-lectores">{t('pantallas.mapa')}</h1>
      <MapaLugares lugares={lugares} arriba={<ControlRecorrido />} abajo={<Panel />} />
    </main>
  )
}
