import { describe, expect, it } from 'vitest'
import { SALIDA_MANUAL as ZOCALO, ZOCALO as CENTRO } from './centro'
import { moverManual, obtenerManual, posicionEfectiva, reiniciarManual, salidaDeLaRuta, usaPosicionManual } from './posicionManual'
import type { Posicion } from './tipos'

const gps = (lat: number, lng: number): Posicion => ({ lat, lng, precision: 8, fuente: 'gps' })
const CERCA = gps(CENTRO.lat + 0.002, CENTRO.lng)
const LEJOS = gps(19.43, -99.13) // Ciudad de México

describe('posición por toque (lejos del Centro)', () => {
  it('solo se usa si el GPS está lejos o no hay GPS', () => {
    expect(usaPosicionManual(CERCA, 'concedido')).toBe(false)
    expect(usaPosicionManual(LEJOS, 'concedido')).toBe(true)
    expect(usaPosicionManual(null, 'no-disponible')).toBe(true)
    expect(usaPosicionManual(null, 'pendiente')).toBe(false)
  })

  it('cerca del Centro manda el GPS real', () => {
    expect(posicionEfectiva(CERCA, 'concedido', { lat: 1, lng: 1 })).toBe(CERCA)
  })

  it('lejos del Centro manda el punto tocado y se ve como un GPS normal', () => {
    const p = posicionEfectiva(LEJOS, 'concedido', { lat: 19.2, lng: -96.14 })
    expect(p).toEqual({ lat: 19.2, lng: -96.14, precision: 5, fuente: 'gps' })
  })

  it('la ruta sale del Zócalo lejos del Centro y reinicia la posición', () => {
    moverManual({ lat: 19.199, lng: -96.133 })
    expect(salidaDeLaRuta(LEJOS, 'concedido')).toEqual(ZOCALO)
    expect(obtenerManual()).toEqual(ZOCALO)
  })

  it('cerca del Centro la ruta sale de donde está el turista', () => {
    expect(salidaDeLaRuta(CERCA, 'concedido')).toEqual({ lat: CERCA.lat, lng: CERCA.lng })
    expect(salidaDeLaRuta(null, 'pendiente')).toBeNull()
  })

  it('moverManual guarda el punto', () => {
    moverManual({ lat: 19.2, lng: -96.13 })
    expect(obtenerManual()).toEqual({ lat: 19.2, lng: -96.13 })
    reiniciarManual()
    expect(obtenerManual()).toEqual(ZOCALO)
  })
})
