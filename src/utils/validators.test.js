import { describe, expect, it } from 'vitest'
import { boundedInteger } from './validators.js'

describe('boundedInteger', () => {
  it('acepta enteros dentro del rango', () => expect(boundedInteger('4', 'El pase')).toBe(4))
  it('rechaza decimales y valores fuera del rango', () => {
    expect(() => boundedInteger('1.5', 'El pase')).toThrow('entero')
    expect(() => boundedInteger('100', 'El pase')).toThrow('entre 1 y 99')
  })
})
