import { describe, expect, it } from 'vitest'
import { esErrorDeModulo } from './recarga'

describe('esErrorDeModulo', () => {
  it('reconoce los errores de módulos que no se descargan', () => {
    expect(esErrorDeModulo(new TypeError('Failed to fetch dynamically imported module: https://x/assets/Mapa-abc.js'))).toBe(true)
    expect(esErrorDeModulo(new Error('Importing a module script failed.'))).toBe(true)
    expect(esErrorDeModulo(new Error('Loading chunk 12 failed'))).toBe(true)
  })
  it('no confunde otros errores', () => {
    expect(esErrorDeModulo(new Error('Cannot read properties of undefined'))).toBe(false)
    expect(esErrorDeModulo('otra cosa')).toBe(false)
  })
})
