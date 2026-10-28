const ALLOWED_VARIABLES = new Set(['celebrant_name', 'event_name', 'event_date', 'event_time', 'event_address', 'guest_name'])

export function renderInvitationMessage(template, values = {}) {
  return String(template ?? '').replace(/\{([a-z_]+)\}/gi, (match, key) => {
    const normalized = key.toLowerCase()
    return ALLOWED_VARIABLES.has(normalized) && values[normalized] != null ? String(values[normalized]) : match
  })
}

export function invitationVariables(event, guestName = '') {
  const date = new Date(event.event_date)
  return {
    celebrant_name: event.celebrant_name,
    event_name: event.event_name,
    event_date: Number.isNaN(date.valueOf()) ? '' : new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(date),
    event_time: Number.isNaN(date.valueOf()) ? '' : new Intl.DateTimeFormat('es-MX', { timeStyle: 'short' }).format(date),
    event_address: event.event_address,
    guest_name: guestName,
  }
}

