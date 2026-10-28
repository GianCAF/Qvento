import { describe, expect, it } from 'vitest'
import { buildBackgroundDesign, pickStrongestBackgroundColor, sanitizeTheme } from './theme-manager.js'

describe('sanitizeTheme', () => {
  it('acepta hexadecimal y reemplaza valores peligrosos', () => {
    const theme = sanitizeTheme({ primary_color: '#aabbcc', button_color: 'url(javascript:1)' })
    expect(theme.primary_color).toBe('#AABBCC')
    expect(theme.button_color).toBe('#BE185D')
  })

  it('acepta presets conocidos y determina colores seguros', () => {
    const theme = sanitizeTheme({
      background_style: 'aurora',
      background_color_1: '#112233',
      background_color_2: '#445566',
      background_color_3: '#778899',
    })
    expect(theme.background_style).toBe('aurora')
    expect(buildBackgroundDesign(theme)).toContain('#778899')
  })

  it('rechaza presets y colores de fondo desconocidos', () => {
    const theme = sanitizeTheme({ background_style: 'url(javascript:1)', background_color_1: 'red' })
    expect(theme.background_style).toBe('watercolor')
    expect(theme.background_color_1).toBe('#FFF1F2')
  })

  it('selecciona el color de fondo con mayor intensidad para la letra capitular', () => {
    expect(pickStrongestBackgroundColor({
      background_color_1: '#FFF8F5',
      background_color_2: '#E8D8D0',
      background_color_3: '#9F3A52',
    })).toBe('#9F3A52')
  })

  it('acepta animaciones conocidas y sanea sus colores', () => {
    const theme = sanitizeTheme({ animation_style: 'fireworks', animation_color_1: '#123abc' })
    expect(theme.animation_style).toBe('fireworks')
    expect(theme.animation_color_1).toBe('#123ABC')
    expect(sanitizeTheme({ animation_style: 'url(javascript:1)' }).animation_style).toBe('none')
  })
})

