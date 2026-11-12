// Tipos del contrato 2 (usePosition). Viven aparte para no crear dependencias circulares.
export type FuentePosicion = 'gps'

export interface Punto {
  lat: number
  lng: number
}

export interface Posicion extends Punto {
  precision: number
  fuente: FuentePosicion
}

/** Estado del permiso de ubicación. 'denegado' y 'no-disponible' activan el modo explorador. */
export type EstadoUbicacion = 'pendiente' | 'concedido' | 'denegado' | 'no-disponible'
