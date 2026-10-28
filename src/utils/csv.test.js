import { describe, expect, it } from 'vitest'
import { parseGuestsCsv } from './csv.js'

describe('parseGuestsCsv', () => {
  it('procesa campos citados y encabezados', () => {
    expect(parseGuestsCsv('full_name,email,phone,party_size\n"Pérez, Ana",ana@test.mx,123,4')[0]).toEqual({ full_name: 'Pérez, Ana', email: 'ana@test.mx', phone: '123', party_size: 4 })
  })
  it('usa una persona cuando el CSV no especifica la capacidad', () => expect(parseGuestsCsv('full_name\nAna')[0].party_size).toBe(1))
  it('exige la columna full_name', () => expect(() => parseGuestsCsv('name,email\nAna,a@b.mx')).toThrow('full_name'))
})
