import { isInvitationToken } from './validators.js'

export function invitationUrl(token, origin = window.location.origin) {
  if (!isInvitationToken(token)) throw new Error('Token de invitación inválido.')
  return `${origin}/invitacion/${token}`
}

export function tokenFromQrText(text) {
  try {
    const url = new URL(text)
    const match = url.pathname.match(/^\/invitacion\/([0-9a-f]{64})\/?$/i)
    return match?.[1] ?? null
  } catch {
    return isInvitationToken(text) ? text : null
  }
}

