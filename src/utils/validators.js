export const isHexColor = (value) => /^#[0-9a-f]{6}$/i.test(String(value))
export const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value))
export const isInvitationToken = (value) => /^[0-9a-f]{64}$/i.test(String(value))

export function requiredText(value, label, max = 300) {
  const normalized = String(value ?? '').trim()
  if (!normalized) throw new Error(`${label} es obligatorio.`)
  if (normalized.length > max) throw new Error(`${label} excede ${max} caracteres.`)
  return normalized
}

export function optionalText(value, max = 1000) {
  const normalized = String(value ?? '').trim()
  if (normalized.length > max) throw new Error(`El texto excede ${max} caracteres.`)
  return normalized || null
}

export function safeReturnPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : '/'
}

