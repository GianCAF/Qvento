import { describe, expect, it } from 'vitest'
import { parseGuestsCsv } from './csv.js'

describe('parseGuestsCsv', () => {
  it('procesa campos citados y encabezados', () => {
    expect(parseGuestsCsv('full_name,email,phone\n"Pérez, Ana",ana@test.mx,123')[0]).toEqual({ full_name: 'Pérez, Ana', email: 'ana@test.mx', phone: '123' })
  })
  it('exige la columna full_name', () => expect(() => parseGuestsCsv('name,email\nAna,a@b.mx')).toThrow('full_name'))
})
