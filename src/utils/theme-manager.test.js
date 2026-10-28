import { describe, expect, it } from 'vitest'
import { sanitizeTheme } from './theme-manager.js'

describe('sanitizeTheme', () => {
  it('acepta hexadecimal y reemplaza valores peligrosos', () => {
    const theme = sanitizeTheme({ primary_color: '#aabbcc', button_color: 'url(javascript:1)' })
    expect(theme.primary_color).toBe('#AABBCC')
    expect(theme.button_color).toBe('#BE185D')
  })
})

