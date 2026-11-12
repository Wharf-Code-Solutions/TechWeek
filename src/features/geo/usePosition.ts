// Contrato 2 · usePosition(). Mapa, llegada y recorrido virtual solo hablan con este hook.
// Responsable: Dev 3 (M5 GPS, M6 recorrido virtual). Por ahora devuelve una posición falsa (Zócalo).
export type FuentePosicion = 'gps' | 'demo'

export interface Posicion {
  lat: number
  lng: number
  precision: number
  fuente: FuentePosicion
}

export function usePosition(): Posicion | null {
  return { lat: 19.19935, lng: -96.13705, precision: 10, fuente: 'demo' }
}
