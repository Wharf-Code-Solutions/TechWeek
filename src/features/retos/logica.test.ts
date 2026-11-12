import { describe, expect, it } from 'vitest'
import { barajar, colocar, contarHuecos, indiceHueco, mover, quitar } from './logica'

describe('palabras', () => {
  it('detecta los huecos', () => {
    expect(indiceHueco('{2}')).toBe(2)
    expect(indiceHueco('texto {0}')).toBeNull()
    expect(contarHuecos(['a ', '{0}', ' b ', '{1}', '.'])).toBe(2)
  })
  it('coloca en el primer hueco vacío y quita', () => {
    const r = colocar([null, null], 'x')
    expect(r).toEqual(['x', null])
    expect(colocar(['x', 'y'], 'z')).toEqual(['x', 'y'])
    expect(colocar(quitar(['x', 'y'], 0), 'z')).toEqual(['z', 'y'])
  })
})

describe('orden', () => {
  it('mueve sin salirse de la lista', () => {
    expect(mover(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c'])
    expect(mover(['a', 'b'], 0, -1)).toEqual(['a', 'b'])
  })
  it('barajar nunca devuelve el orden original', () => {
    const ids = ['e1', 'e2', 'e3', 'e4']
    // azar que no mueve nada: obliga al caso de respaldo
    const sinCambio = barajar(ids, () => 0.9999)
    expect(sinCambio).not.toEqual(ids)
    expect([...sinCambio].sort()).toEqual(ids)
    for (let k = 0; k < 50; k++) expect(barajar(ids)).not.toEqual(ids)
  })
})
