// Contratos 1 y 3 · Tipos del catálogo y de los retos.
// Cuando el esquema esté en Supabase, `database.ts` se generará con `supabase gen types`.

export type Categoria = 'historia' | 'leyendas' | 'musica' | 'comida' | 'mar' | 'artesania'
export type Idioma = 'es' | 'en'

export interface Lugar {
  slug: string
  nombre_es: string
  nombre_en: string
  categoria: Categoria
  lat: number
  lng: number
  verificar?: boolean
  radio_m: number
  curiosidad_es: string
  curiosidad_en: string
  ilustracion: string
  orden_sugerido: number
  en_demo: boolean
}

/** Reto "Completa la leyenda". Cada "{n}" en `texto` es un hueco; `respuestas[n]` es su palabra correcta. */
export interface ContenidoPalabras {
  texto: string[]
  respuestas: string[]
  opciones: string[]
}

/**
 * Reto "Orden cronológico". `orden_correcto` lista los `id` de los eventos.
 * Si existe `anio_texto` (p. ej. "Siglo XVII"), la pantalla lo muestra en lugar de `anio`.
 */
export interface ContenidoOrden {
  eventos: { id: string; anio: number; anio_texto?: string; texto: string }[]
  orden_correcto: string[]
}

interface RetoBase {
  lugar_slug: string
  tlacos: number
  tlacos_revelado: number
  intentos_max: number
}

export type Reto =
  | (RetoBase & { tipo: 'palabras'; contenido_es: ContenidoPalabras; contenido_en: ContenidoPalabras })
  | (RetoBase & { tipo: 'orden'; contenido_es: ContenidoOrden; contenido_en: ContenidoOrden })

export interface Comercio {
  slug: string
  nombre: string
  categoria: Categoria
  lat: number
  lng: number
  direccion?: string
  pendiente_confirmar?: boolean
}

export interface Promocion {
  slug: string
  comercio_slug: string
  titulo_es: string
  titulo_en: string
  costo_tlacos: number
  activa: boolean
}

export interface Evento {
  slug: string
  titulo_es: string
  titulo_en: string
  lugar: string
  lat: number
  lng: number
  inicio: string
  fin: string
  categoria: Categoria
  pendiente_confirmar?: boolean
}

export interface FotoHistorica {
  slug: string
  url: string
  titulo_es: string
  titulo_en: string
  piezas: number
  /** Créditos (solo en el seed; ver public/fotos/CREDITOS.md) */
  autor?: string
  fecha?: string
  licencia?: string
  fuente?: string
}
