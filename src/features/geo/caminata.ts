// La personita camina por las calles hasta el destino en vez de saltar en línea recta. Solo se usa con la posición
// por toque (lejos del Centro o sin GPS): cada paso actualiza la posición, así la llegada (40 m), la línea guía y
// la cámara se comportan igual que con un GPS que avanza.
import { TOKEN, pedirCalles, type Coord } from './calles'
import { distanciaM } from './distancia'
import { moverManual, obtenerManual } from './posicionManual'
import type { Punto } from './tipos'

/** Rapidez de la caminata simulada (m/s): una cuadra se cruza en un par de segundos. */
const VELOCIDAD_M_S = 45
const DURACION_MIN_MS = 1200
const DURACION_MAX_MS = 9000
/** Cada cuántos ms se actualiza la posición (~15 veces por segundo). */
const PASO_MS = 66

const aPunto = ([lng, lat]: Coord): Punto => ({ lat, lng })

/** Distancias acumuladas a lo largo de la línea y su largo total (m). */
export function medirLinea(linea: Coord[]): { acumuladas: number[]; total: number } {
  const acumuladas = [0]
  for (let i = 1; i < linea.length; i++) acumuladas.push(acumuladas[i - 1] + distanciaM(aPunto(linea[i - 1]), aPunto(linea[i])))
  return { acumuladas, total: acumuladas[acumuladas.length - 1] }
}

/** Punto a `d` metros del inicio de la línea. */
export function puntoEn(linea: Coord[], acumuladas: number[], d: number): Punto {
  if (d <= 0) return aPunto(linea[0])
  const i = acumuladas.findIndex((a) => a >= d)
  if (i < 1) return aPunto(linea[linea.length - 1])
  const largo = acumuladas[i] - acumuladas[i - 1]
  const f = largo > 0 ? (d - acumuladas[i - 1]) / largo : 0
  const [lng0, lat0] = linea[i - 1]
  const [lng1, lat1] = linea[i]
  return { lat: lat0 + (lat1 - lat0) * f, lng: lng0 + (lng1 - lng0) * f }
}

let turno = 0

/** Detiene la caminata en curso (si la hay). */
export const detenerCaminata = () => void turno++

/**
 * Camina por las calles desde donde está el turista hasta `destino`. Devuelve true si llegó, false si otra caminata
 * (o un movimiento externo, como armar una ruta nueva) la interrumpió.
 */
export async function caminarHasta(destino: Punto): Promise<boolean> {
  const mio = ++turno
  const desde = obtenerManual()
  let calle: Coord[] = []
  if (TOKEN) {
    try {
      calle = await pedirCalles([desde, destino])
    } catch {
      /* sin red: camina en línea recta */
    }
  }
  if (mio !== turno) return false
  const linea: Coord[] = [[desde.lng, desde.lat], ...calle, [destino.lng, destino.lat]]
  const { acumuladas, total } = medirLinea(linea)
  if (total < 3) {
    moverManual(destino)
    return true
  }
  const duracion = Math.min(DURACION_MAX_MS, Math.max(DURACION_MIN_MS, (total / VELOCIDAD_M_S) * 1000))
  return new Promise<boolean>((resolver) => {
    const inicio = performance.now()
    let ultimoPaso = 0
    let ultimo: Punto = desde
    const cuadro = (ahora: number) => {
      const actual = obtenerManual()
      if (mio !== turno || actual.lat !== ultimo.lat || actual.lng !== ultimo.lng) return resolver(false)
      const f = Math.min(1, (ahora - inicio) / duracion)
      if (f >= 1 || ahora - ultimoPaso >= PASO_MS) {
        ultimoPaso = ahora
        ultimo = f >= 1 ? { lat: destino.lat, lng: destino.lng } : puntoEn(linea, acumuladas, f * total)
        moverManual(ultimo)
      }
      if (f >= 1) return resolver(true)
      requestAnimationFrame(cuadro)
    }
    requestAnimationFrame(cuadro)
  })
}
