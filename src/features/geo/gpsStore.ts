// M5 · Un solo watchPosition compartido por toda la app. Arranca con el primer suscriptor y se detiene con el último.
import type { EstadoUbicacion, Posicion } from './tipos'

interface InstantaneaGps {
  estado: Exclude<EstadoUbicacion, 'demo'>
  posicion: Posicion | null
}

let instantanea: InstantaneaGps = { estado: 'pendiente', posicion: null }
const oyentes = new Set<() => void>()
let vigilante: number | null = null

function publicar(nueva: InstantaneaGps) {
  instantanea = nueva
  oyentes.forEach((o) => o())
}

function iniciar() {
  if (!('geolocation' in navigator)) {
    publicar({ estado: 'no-disponible', posicion: null })
    return
  }
  vigilante = navigator.geolocation.watchPosition(
    (p) =>
      publicar({
        estado: 'concedido',
        posicion: {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          precision: p.coords.accuracy,
          fuente: 'gps',
        },
      }),
    (e) =>
      // PERMISSION_DENIED = 1. Otros errores (señal débil) no cambian el permiso ya concedido.
      e.code === 1
        ? publicar({ estado: 'denegado', posicion: null })
        : instantanea.estado === 'pendiente' && publicar({ estado: 'no-disponible', posicion: null }),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
  )
}

function detener() {
  if (vigilante !== null) navigator.geolocation.clearWatch(vigilante)
  vigilante = null
}

export function suscribirGps(oyente: () => void) {
  oyentes.add(oyente)
  if (oyentes.size === 1) iniciar()
  return () => {
    oyentes.delete(oyente)
    if (oyentes.size === 0) detener()
  }
}

export const obtenerGps = () => instantanea
