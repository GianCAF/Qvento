import { describe, expect, it } from 'vitest'
import { renderInvitationMessage } from './template-engine.js'

describe('renderInvitationMessage', () => {
  it('sustituye únicamente variables permitidas', () => {
    expect(renderInvitationMessage('Hola {guest_name}; {danger}', { guest_name: '<Ana>' })).toBe('Hola <Ana>; {danger}')
  })

  it('no ejecuta ni interpreta HTML', () => {
    const value = '<img src=x onerror=alert(1)>'
    expect(renderInvitationMessage('{guest_name}', { guest_name: value })).toBe(value)
  })
})

