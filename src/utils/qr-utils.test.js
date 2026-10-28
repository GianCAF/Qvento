import { describe, expect, it } from 'vitest'
import { tokenFromQrText } from './qr-utils.js'

describe('tokenFromQrText', () => {
  it('extrae solamente tokens válidos de invitaciones', () => {
    const token = 'a'.repeat(64)
    expect(tokenFromQrText(`https://qvento.test/invitacion/${token}`)).toBe(token)
    expect(tokenFromQrText('https://evil.test/invitacion/no')).toBeNull()
  })
})

