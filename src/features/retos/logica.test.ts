import { describe, expect, it } from 'vitest'
import {
  barajar,
  colocar,
  colocarEn,
  contarHuecos,
  esRapido,
  indiceHueco,
  mover,
  opcionesRapido,
  quitar,
  respuestaInicial,
  type RetoPublico,
} from './logica'

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

describe('arrastrar a un hueco', () => {
  it('coloca la palabra en el hueco elegido', () => {
    expect(colocarEn([null, null, null], 'x', 1)).toEqual([null, 'x', null])
  })
  it('si el hueco estaba ocupado, la palabra anterior queda libre', () => {
    expect(colocarEn(['a', 'b'], 'x', 0)).toEqual(['x', 'b'])
  })
  it('mover una palabra de un hueco a otro la quita del primero', () => {
    expect(colocarEn(['x', null], 'x', 1)).toEqual([null, 'x'])
  })
  it('ignora huecos que no existen', () => {
    expect(colocarEn([null], 'x', 3)).toEqual([null])
    expect(colocarEn([null], 'x', -1)).toEqual([null])
  })
})

describe('retos rápidos', () => {
  const base = { lugar_slug: 'x', tlacos: 30, tlacos_revelado: 10, intentos_max: 3 }
  const trivia = {
    ...base,
    tipo: 'trivia',
    contenido_es: { pregunta: 'P es', opciones: ['a', 'b'] },
    contenido_en: { pregunta: 'P en', opciones: ['c', 'd'] },
  } as RetoPublico
  const vf = {
    ...base,
    tipo: 'verdadero_falso',
    contenido_es: { afirmacion: 'A es' },
    contenido_en: { afirmacion: 'A en' },
  } as RetoPublico

  it('reconoce los tipos de un toque', () => {
    expect(['trivia', 'intruso', 'verdadero_falso'].every((t) => esRapido(t as RetoPublico['tipo']))).toBe(true)
    expect(esRapido('palabras')).toBe(false)
    expect(esRapido('orden')).toBe(false)
  })
  it('da enunciado y opciones en el idioma pedido', () => {
    expect(opcionesRapido(trivia, 'en')).toEqual({ enunciado: 'P en', opciones: ['c', 'd'] })
  })
  it('verdadero/falso usa los ids que valida el servidor', () => {
    expect(opcionesRapido(vf, 'es')).toEqual({ enunciado: 'A es', opciones: ['verdadero', 'falso'] })
  })
  it('no hay respuesta inicial: se manda al tocar', () => {
    expect(respuestaInicial(trivia, 'es')).toEqual([])
  })
})
