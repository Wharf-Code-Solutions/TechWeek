// M8 · Lógica pura de los minijuegos (UI). La validación vive en el servidor.
import type {
  ContenidoIntruso,
  ContenidoOrden,
  ContenidoPalabras,
  ContenidoTrivia,
  ContenidoVerdaderoFalso,
  Idioma,
  Reto,
} from '../../types/contratos'

/** Reto tal como lo entrega GET /api/lugares/{slug}/reto: sin respuestas correctas. */
export type RetoPublico = Omit<Reto, 'contenido_es' | 'contenido_en' | 'contenido_fr'> &
  (
    | { tipo: 'palabras'; contenido_es: Omit<ContenidoPalabras, 'respuestas'>; contenido_en: Omit<ContenidoPalabras, 'respuestas'>; contenido_fr?: Omit<ContenidoPalabras, 'respuestas'> | null }
    | { tipo: 'orden'; contenido_es: Omit<ContenidoOrden, 'orden_correcto'>; contenido_en: Omit<ContenidoOrden, 'orden_correcto'>; contenido_fr?: Omit<ContenidoOrden, 'orden_correcto'> | null }
    | { tipo: 'trivia'; contenido_es: Omit<ContenidoTrivia, 'correcta'>; contenido_en: Omit<ContenidoTrivia, 'correcta'>; contenido_fr?: Omit<ContenidoTrivia, 'correcta'> | null }
    | { tipo: 'intruso'; contenido_es: Omit<ContenidoIntruso, 'correcta'>; contenido_en: Omit<ContenidoIntruso, 'correcta'>; contenido_fr?: Omit<ContenidoIntruso, 'correcta'> | null }
    | { tipo: 'verdadero_falso'; contenido_es: Omit<ContenidoVerdaderoFalso, 'correcta'>; contenido_en: Omit<ContenidoVerdaderoFalso, 'correcta'>; contenido_fr?: Omit<ContenidoVerdaderoFalso, 'correcta'> | null }
  )

/** Contenido del reto en `idioma`; el francés que falte cae al inglés. */
export const contenidoEn = <T,>(es: T, en: T, fr: T | null | undefined, idioma: Idioma): T =>
  idioma === 'fr' ? (fr ?? en) : idioma === 'en' ? en : es

/** Idioma del contenido del reto: el francés que aún no esté traducido se juega en inglés. */
export const idiomaDelReto = (reto: Pick<RetoPublico, 'contenido_fr'>, idioma: Idioma): Idioma =>
  idioma === 'fr' && !reto.contenido_fr ? 'en' : idioma

/** Retos rápidos de un toque: trivia, verdadero/falso e intruso. */
export const esRapido = (tipo: RetoPublico['tipo']) => tipo === 'trivia' || tipo === 'intruso' || tipo === 'verdadero_falso'

/** Enunciado y opciones de un reto rápido. Verdadero/falso usa los ids que espera el servidor. */
export function opcionesRapido(reto: RetoPublico, idioma: Idioma) {
  if (reto.tipo === 'verdadero_falso')
    return { enunciado: contenidoEn(reto.contenido_es, reto.contenido_en, reto.contenido_fr, idioma).afirmacion, opciones: ['verdadero', 'falso'] }
  if (reto.tipo === 'trivia' || reto.tipo === 'intruso')
    return { enunciado: contenidoEn(reto.contenido_es, reto.contenido_en, reto.contenido_fr, idioma).pregunta, opciones: contenidoEn(reto.contenido_es, reto.contenido_en, reto.contenido_fr, idioma).opciones }
  return null
}

/** Índice del hueco si el fragmento es "{n}", o null si es texto. */
export const indiceHueco = (fragmento: string): number | null => {
  const m = /^\{(\d+)\}$/.exec(fragmento)
  return m ? Number(m[1]) : null
}

export const contarHuecos = (texto: string[]) =>
  texto.reduce((max, f) => Math.max(max, (indiceHueco(f) ?? -1) + 1), 0)

/** Pone la palabra en el primer hueco vacío. */
export function colocar(llenos: (string | null)[], palabra: string) {
  const i = llenos.indexOf(null)
  return i === -1 ? llenos : llenos.map((p, j) => (j === i ? palabra : p))
}

/** Pone la palabra en el hueco `i` (arrastrar y soltar). Si ese hueco ya tenía otra palabra, esa queda libre. */
export function colocarEn(llenos: (string | null)[], palabra: string, i: number) {
  if (i < 0 || i >= llenos.length) return llenos
  return llenos.map((p, j) => (j === i ? palabra : p === palabra ? null : p))
}

export const quitar = (llenos: (string | null)[], i: number) => llenos.map((p, j) => (j === i ? null : p))

/** Mueve el elemento `i` una posición (delta -1 sube, +1 baja). */
export function mover<T>(lista: T[], i: number, delta: number): T[] {
  const j = i + delta
  if (j < 0 || j >= lista.length) return lista
  const copia = [...lista]
  ;[copia[i], copia[j]] = [copia[j], copia[i]]
  return copia
}

/** Baraja garantizando un orden distinto al recibido: la API entrega los eventos en orden cronológico. */
export function barajar<T>(lista: T[], azar = Math.random): T[] {
  if (lista.length < 2) return lista
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia.every((x, i) => x === lista[i]) ? mover(copia, 0, 1) : copia
}

/** Respuesta inicial: huecos vacíos o eventos barajados. */
export function respuestaInicial(reto: RetoPublico, idioma: Idioma): (string | null)[] {
  if (reto.tipo === 'palabras') return Array(contarHuecos(contenidoEn(reto.contenido_es, reto.contenido_en, reto.contenido_fr, idioma).texto)).fill(null)
  if (reto.tipo === 'orden') return barajar(contenidoEn(reto.contenido_es, reto.contenido_en, reto.contenido_fr, idioma).eventos.map((e) => e.id))
  return [] // retos rápidos: la respuesta se manda al tocar una opción
}
