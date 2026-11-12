// Escena ilustrada (banner) de cada categoría: se usa en ¡Llegaste! y en el reto del lugar.
import type { Categoria } from '../../types/contratos'

const POR_CATEGORIA: Record<Categoria, string> = {
  historia: 'escena-historia',
  leyendas: 'escena-leyenda',
  musica: 'escena-musica',
  comida: 'escena-comida',
  mar: 'escena-puerto',
  artesania: 'escena-artesania',
}

/** Nombre de la escena de la categoría; sin categoría, la del puerto. */
export const escenaDe = (categoria?: Categoria) => (categoria ? POR_CATEGORIA[categoria] : 'escena-puerto')
