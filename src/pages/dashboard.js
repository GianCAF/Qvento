import { adminSummary, superadminSummary } from '../services/statistics.js'

function metricCard(label, value, accent = false) {
  const card = document.createElement('article'); card.className = `metric-card ${accent ? 'metric-accent' : ''}`
  const copy = document.createElement('p'); copy.className = 'text-sm text-slate-500'; copy.textContent = label
  const number = document.createElement('p'); number.className = 'mt-3 text-4xl font-bold tracking-tight'; number.textContent = value
  card.append(copy, number); return card
}

export async function dashboardPage(profile) {
  const section = document.createElement('section')
  const header = document.createElement('div'); header.className = 'page-heading'
  const texts = document.createElement('div')
  const hello = document.createElement('p'); hello.className = 'text-sm font-bold uppercase tracking-widest text-violet'; hello.textContent = 'Panel de control'
  const title = document.createElement('h1'); title.textContent = `Hola, ${profile.full_name}`
  const subtitle = document.createElement('p'); subtitle.textContent = profile.role === 'superadmin' ? 'Una vista completa de la operación de Qvento.' : 'Así avanzan tus eventos e invitaciones.'
  texts.append(hello, title, subtitle); header.append(texts); section.append(header)
  const grid = document.createElement('div'); grid.className = 'metric-grid mt-8'; section.append(grid)
  if (profile.role === 'superadmin') {
    const stats = await superadminSummary()
    ;[['Administradores', stats.admins], ['Administradores activos', stats.activeAdmins], ['Eventos', stats.events], ['Próximos', stats.upcoming], ['Invitados', stats.guests], ['Accesos utilizados', stats.used]].forEach(([label, value], index) => grid.append(metricCard(label, value, index === 0)))
  } else {
    const stats = await adminSummary()
    ;[['Eventos', stats.events], ['Invitados', stats.guests], ['Disponibles', stats.available], ['Utilizados', stats.used], ['Revocados', stats.revoked], ['Asistencia', `${stats.attendance}%`]].forEach(([label, value], index) => grid.append(metricCard(label, value, index === 3)))
  }
  return section
}

