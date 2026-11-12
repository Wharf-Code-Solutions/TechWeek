// Modo explorador: el turista no comparte ubicación. Ve curiosidades, pero no gana doblones ni sellos.
const CLAVE = 'jarana.explorador'

export function esExplorador(): boolean {
  try {
    return sessionStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}

export function activarExplorador(activo = true) {
  try {
    if (activo) sessionStorage.setItem(CLAVE, '1')
    else sessionStorage.removeItem(CLAVE)
  } catch {
    /* sin almacenamiento */
  }
}
