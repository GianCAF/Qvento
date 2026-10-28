import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { renderAnimatedBackground } from './animated-background.js'

describe('renderAnimatedBackground', () => {
  it('renderiza únicamente efectos permitidos y reemplaza el anterior', () => {
    const document = new JSDOM('<section></section>').window.document
    const section = document.querySelector('section')
    expect(renderAnimatedBackground(section, 'stars').children).toHaveLength(20)
    expect(renderAnimatedBackground(section, 'petals').children).toHaveLength(16)
    expect(section.querySelectorAll('.qv-effect-layer')).toHaveLength(1)
    expect(renderAnimatedBackground(section, 'javascript:alert(1)')).toBeNull()
    expect(section.querySelector('.qv-effect-layer')).toBeNull()
  })
})
