import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { renderDropCap } from './editorial-text.js'

describe('renderDropCap', () => {
  it('convierte la primera letra real en capitular sin duplicar el texto accesible', () => {
    const document = new JSDOM('<p></p>').window.document
    const paragraph = document.querySelector('p')
    renderDropCap(paragraph, '¡Hola!')
    expect(paragraph.querySelector('.drop-cap').textContent).toBe('H')
    expect(paragraph.querySelector('.sr-only').textContent).toBe('¡Hola!')
    expect(paragraph.querySelector('.visual-copy').textContent).toBe('Hola!')
    expect(paragraph.querySelector('.visual-copy').getAttribute('aria-hidden')).toBe('true')
  })
})
