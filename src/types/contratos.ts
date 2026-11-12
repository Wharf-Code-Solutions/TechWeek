// Contratos 1 y 3 · Tipos del catálogo y de los retos.
// Cuando el esquema esté en Supabase, `database.ts` se generará con `supabase gen types`.

export type Categoria = 'historia' | 'leyendas' | 'musica' | 'comida' | 'mar' | 'artesania'
export type Idioma = 'es' | 'en' | 'fr'

export interface Lugar {
  slug: string
  nombre_es: string
  nombre_en: string
  /** Francés: puede faltar; entonces se muestra el inglés (ver useCampo). */
  nombre_fr?: string | null
  categoria: Categoria
  lat: number
  lng: number
  verificar?: boolean
  radio_m: number
  curiosidad_es: string
  curiosidad_en: string
  curiosidad_fr?: string | null
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

/**
 * Reto "Trivia": una pregunta y 3 opciones; se toca una. `correcta` es el texto de la opción buena
 * (el backend la quita antes de enviarla). Respuesta: `[opcionElegida]`.
 */
export interface ContenidoTrivia {
  pregunta: string
  opciones: string[]
  correcta: string
}

/** Reto "¿Verdadero o falso?". Respuesta: `['verdadero']` o `['falso']`. */
export interface ContenidoVerdaderoFalso {
  afirmacion: string
  correcta: boolean
}

/** Reto "¿Cuál es el intruso?": 4 opciones, una no pertenece. Respuesta: `[opcionIntrusa]`. */
export interface ContenidoIntruso {
  pregunta: string
  opciones: string[]
  correcta: string
}

export type TipoReto = 'palabras' | 'orden' | 'trivia' | 'verdadero_falso' | 'intruso'

interface RetoBase {
  lugar_slug: string
  tlacos: number
  tlacos_revelado: number
  intentos_max: number
}

export type Reto =
  | (RetoBase & { tipo: 'palabras'; contenido_es: ContenidoPalabras; contenido_en: ContenidoPalabras; contenido_fr?: ContenidoPalabras | null })
  | (RetoBase & { tipo: 'orden'; contenido_es: ContenidoOrden; contenido_en: ContenidoOrden; contenido_fr?: ContenidoOrden | null })
  | (RetoBase & { tipo: 'trivia'; contenido_es: ContenidoTrivia; contenido_en: ContenidoTrivia; contenido_fr?: ContenidoTrivia | null })
  | (RetoBase & { tipo: 'verdadero_falso'; contenido_es: ContenidoVerdaderoFalso; contenido_en: ContenidoVerdaderoFalso; contenido_fr?: ContenidoVerdaderoFalso | null })
  | (RetoBase & { tipo: 'intruso'; contenido_es: ContenidoIntruso; contenido_en: ContenidoIntruso; contenido_fr?: ContenidoIntruso | null })

export type TipoComercio =
  | 'cafeteria'
  | 'restaurante'
  | 'fonda'
  | 'neveria'
  | 'mercado'
  | 'libreria'
  | 'artesanias'
  | 'tienda'

/** Comercio de la vitrina (GET /api/comercios?tipo=...). Sin precio ni enlaces externos. */
export interface Comercio {
  slug: string
  nombre: string
  /** Interés al que se asocia (para filtros por preferencias); `tipo` es la clasificación de la vitrina. */
  categoria: Categoria
  tipo: TipoComercio
  lat: number
  lng: number
  descripcion_es: string
  descripcion_en: string
  descripcion_fr?: string | null
  /** Etiqueta destacada opcional ("Desde 1808"). */
  dato_es?: string | null
  dato_en?: string | null
  dato_fr?: string | null
  direccion: string
  horario_es: string
  horario_en: string
  horario_fr?: string | null
  /** Foto del negocio (public/comercios/...). Vacía: la tarjeta usa la ilustración de su tipo. */
  foto_url?: string | null
  /** Tiene promoción en JARANA. */
  aliado: boolean
  verificar?: boolean
  pendiente_confirmar?: boolean
}

export interface Promocion {
  slug: string
  comercio_slug: string
  titulo_es: string
  titulo_en: string
  titulo_fr?: string | null
  costo_tlacos: number
  activa: boolean
}

export interface Evento {
  slug: string
  titulo_es: string
  titulo_en: string
  titulo_fr?: string | null
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
  titulo_fr?: string | null
  piezas: number
  /** Créditos (solo en el seed; ver public/fotos/CREDITOS.md) */
  autor?: string
  fecha?: string
  licencia?: string
  fuente?: string
}
