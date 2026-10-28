import { getPublicInvitation } from '../services/guests.js'
import { renderInvitationMessage, invitationVariables } from '../utils/template-engine.js'
import { applyTheme } from '../utils/theme-manager.js'
import { invitationUrl } from '../utils/qr-utils.js'
import { renderQr } from '../components/qr-generator.js'
import { DEFAULT_INVITATION_MESSAGE } from '../config.js'

export async function invitationPage(token) {
  const data = await getPublicInvitation(token)
  if (!data) throw new Error('Esta invitación no existe o ya no está disponible.')
  const main = document.createElement('main'); main.className = 'invitation-shell min-h-screen overflow-hidden'; applyTheme(main, data.invitation_theme)
  const track = document.createElement('div'); track.className = 'scene-track'; main.append(track)
  const scene = (eyebrow, title) => { const section = document.createElement('section'); section.className = 'invitation-scene'; const box = document.createElement('div'); box.className = 'scene-card'; const small = document.createElement('p'); small.className = 'scene-eyebrow'; small.textContent = eyebrow; const heading = document.createElement('h1'); heading.textContent = title; box.append(small, heading); section.append(box); track.append(section); return box }
  const welcome = scene('Estás invitado', data.event_name); const celebrant = document.createElement('p'); celebrant.className = 'scene-copy'; celebrant.textContent = `Acompaña a ${data.celebrant_name} en un día inolvidable.`; welcome.append(celebrant)
  const message = scene(`Para ${data.guest_name}`, 'Tenemos algo que celebrar'); const copy = document.createElement('p'); copy.className = 'scene-copy'; copy.textContent = renderInvitationMessage(data.invitation_message || DEFAULT_INVITATION_MESSAGE, invitationVariables(data, data.guest_name)); message.append(copy)
  const details = scene('Agenda la fecha', new Intl.DateTimeFormat('es-MX', { dateStyle: 'full' }).format(new Date(data.event_date))); const detailCopy = document.createElement('p'); detailCopy.className = 'scene-copy'; detailCopy.textContent = `${new Intl.DateTimeFormat('es-MX', { timeStyle: 'short' }).format(new Date(data.event_date))} · ${data.event_address}`; details.append(detailCopy); if (data.event_description) { const description = document.createElement('p'); description.className = 'mt-4'; description.textContent = data.event_description; details.append(description) }
  const pass = scene('Entrada digital', data.guest_name); pass.parentElement.classList.add('qr-scene'); const canvas = document.createElement('canvas'); canvas.className = 'qr-canvas'; const status = document.createElement('p'); status.className = `status status-${data.access_status}`; status.textContent = { available: 'Entrada disponible', used: 'Entrada utilizada', revoked: 'Entrada revocada' }[data.access_status] ?? data.access_status; const share = Object.assign(document.createElement('button'), { className: 'button-primary', textContent: 'Compartir invitación' }); share.addEventListener('click', async () => { const payload = { title: data.event_name, text: `Invitación para ${data.guest_name}`, url: invitationUrl(token) }; if (navigator.share) await navigator.share(payload); else await navigator.clipboard.writeText(payload.url) }); pass.append(canvas, status, share); await renderQr(canvas, invitationUrl(token))
  const nav = document.createElement('div'); nav.className = 'scene-nav'; const prev = Object.assign(document.createElement('button'), { textContent: 'Anterior', className: 'button-secondary' }); const next = Object.assign(document.createElement('button'), { textContent: 'Siguiente', className: 'button-primary' }); let current = 0
  const update = () => { track.style.transform = `translateX(-${current * 100}%)`; prev.disabled = current === 0; next.textContent = current === 3 ? 'Volver al inicio' : 'Siguiente' }
  prev.addEventListener('click', () => { current = Math.max(0, current - 1); update() }); next.addEventListener('click', () => { current = current === 3 ? 0 : current + 1; update() }); nav.append(prev, next); main.append(nav); update(); return main
}

