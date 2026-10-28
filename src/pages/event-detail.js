import { getEvent, updateEvent } from '../services/events.js'
import { createGuest, createGuests, issueInvitation, listGuests, updateGuest } from '../services/guests.js'
import { DEFAULT_INVITATION_MESSAGE, THEME_FIELDS } from '../config.js'
import { renderInvitationMessage, invitationVariables } from '../utils/template-engine.js'
import { applyTheme, sanitizeTheme } from '../utils/theme-manager.js'
import { invitationUrl } from '../utils/qr-utils.js'
import { requiredText, optionalText } from '../utils/validators.js'
import { parseGuestsCsv } from '../utils/csv.js'
import { createModal } from '../components/modal.js'
import { renderQr, downloadQr } from '../components/qr-generator.js'
import { showToast } from '../components/toast.js'

function invitationModal(token, guestName) {
  const url = invitationUrl(token)
  const content = document.createElement('div'); content.className = 'grid gap-4 text-center'
  const canvas = document.createElement('canvas'); canvas.className = 'mx-auto rounded-xl bg-white p-2'
  const warning = document.createElement('p'); warning.className = 'rounded-xl bg-amber-50 p-3 text-sm text-amber-900'; warning.textContent = 'Guarda o comparte este enlace ahora. Por seguridad, Qvento no puede recuperar el token después.'
  const input = document.createElement('input'); input.className = 'input'; input.readOnly = true; input.value = url
  const actions = document.createElement('div'); actions.className = 'flex flex-wrap justify-center gap-2'
  const copy = Object.assign(document.createElement('button'), { className: 'button-secondary', textContent: 'Copiar enlace' })
  const download = Object.assign(document.createElement('button'), { className: 'button-secondary', textContent: 'Descargar PNG' })
  const share = document.createElement('a'); share.className = 'button-primary'; share.target = '_blank'; share.rel = 'noopener'; share.textContent = 'Compartir por WhatsApp'; share.href = `https://wa.me/?text=${encodeURIComponent(`Hola ${guestName}, esta es tu invitación: ${url}`)}`
  copy.addEventListener('click', async () => { await navigator.clipboard.writeText(url); showToast('Enlace copiado.', 'success') })
  download.addEventListener('click', () => downloadQr(canvas, `invitacion-${guestName.replace(/\s+/g, '-').toLowerCase()}.png`))
  actions.append(copy, download, share); content.append(canvas, input, warning, actions); renderQr(canvas, url)
  createModal({ title: `Invitación de ${guestName}`, content, confirmLabel: 'Listo' })
}

function guestRow(guest, refresh) {
  const row = document.createElement('div'); row.className = 'list-row'
  const info = document.createElement('div')
  const name = document.createElement('p'); name.className = 'font-bold'; name.textContent = guest.full_name
  const contact = document.createElement('p'); contact.className = 'text-sm text-slate-500'; contact.textContent = guest.email || guest.phone || 'Sin contacto'
  info.append(name, contact)
  const state = document.createElement('span'); state.className = `status status-${guest.is_revoked ? 'revoked' : guest.archived ? 'used' : 'available'}`; state.textContent = guest.is_revoked ? 'Revocado' : guest.archived ? 'Utilizado' : 'Disponible'
  const actions = document.createElement('div'); actions.className = 'flex flex-wrap items-center gap-2'
  const edit = Object.assign(document.createElement('button'), { className: 'button-small', textContent: 'Editar' })
  const generate = Object.assign(document.createElement('button'), { className: 'button-small', textContent: guest.is_revoked ? 'Regenerar' : 'Generar enlace' })
  const revoke = Object.assign(document.createElement('button'), { className: 'button-small button-danger', textContent: guest.is_revoked ? 'Reactivar' : 'Revocar' })
  generate.addEventListener('click', async () => { try { const result = await issueInvitation(guest.id); invitationModal(result.token, guest.full_name); await refresh() } catch (cause) { showToast(cause.message, 'error') } })
  edit.addEventListener('click', () => {
    const form = document.createElement('form'); form.className = 'grid gap-3'
    ;[['full_name', 'Nombre', guest.full_name], ['email', 'Correo', guest.email || ''], ['phone', 'Teléfono', guest.phone || '']].forEach(([key, label, value]) => { const field = document.createElement('label'); field.className = 'field'; field.textContent = label; const input = document.createElement('input'); input.name = key; input.value = value; field.append(input); form.append(field) })
    createModal({ title: 'Editar invitado', content: form, confirmLabel: 'Guardar', onConfirm: async () => { const data = Object.fromEntries(new FormData(form)); await updateGuest(guest.id, { full_name: requiredText(data.full_name, 'El nombre', 160), email: optionalText(data.email, 254), phone: optionalText(data.phone, 30) }); showToast('Invitado actualizado.', 'success'); await refresh() } })
  })
  revoke.addEventListener('click', async () => { try { await updateGuest(guest.id, { is_revoked: !guest.is_revoked }); showToast('Estado actualizado.', 'success'); await refresh() } catch (cause) { showToast(cause.message, 'error') } })
  actions.append(state, edit, generate, revoke); row.append(info, actions); return row
}

export async function eventDetailPage(id) {
  const event = await getEvent(id)
  const section = document.createElement('section')
  const heading = document.createElement('div'); heading.className = 'page-heading'
  const titleBox = document.createElement('div'); const kicker = document.createElement('p'); kicker.className = 'kicker'; kicker.textContent = 'Administrar evento'
  const title = document.createElement('h1'); title.textContent = event.event_name
  const sub = document.createElement('p'); sub.textContent = `${new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(event.event_date))} · ${event.event_address}`
  titleBox.append(kicker, title, sub); heading.append(titleBox); section.append(heading)

  const layout = document.createElement('div'); layout.className = 'mt-8 grid gap-6 xl:grid-cols-[1.1fr_.9fr]'; section.append(layout)
  const guestsCard = document.createElement('article'); guestsCard.className = 'card'
  guestsCard.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-2xl font-bold">Invitados</h2><p class="text-sm text-slate-500">Emite enlaces individuales y controla su estado.</p></div><label class="button-secondary cursor-pointer">Importar CSV<input class="sr-only" type="file" accept=".csv,text/csv" data-csv></label></div>
    <form class="mt-6 grid gap-3 sm:grid-cols-2" data-guest-form><label class="field">Nombre<input name="full_name" required maxlength="160"></label><label class="field">Correo<input name="email" type="email"></label><label class="field">Teléfono<input name="phone" type="tel"></label><div class="flex items-end"><button class="button-primary w-full" type="submit">Agregar invitado</button></div><p class="form-error sm:col-span-2"></p></form>`
  const list = document.createElement('div'); list.className = 'mt-6 grid gap-3'; guestsCard.append(list)
  const refreshGuests = async () => { list.replaceChildren(); const guests = await listGuests(id); if (!guests.length) { const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'Aún no hay invitados.'; list.append(empty) } else guests.forEach((guest) => list.append(guestRow(guest, refreshGuests))) }
  guestsCard.querySelector('form').addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault(); const form = submitEvent.currentTarget
    try { const data = Object.fromEntries(new FormData(form)); await createGuest({ event_id: id, full_name: requiredText(data.full_name, 'El nombre', 160), email: optionalText(data.email, 254), phone: optionalText(data.phone, 30) }); form.reset(); showToast('Invitado agregado.', 'success'); await refreshGuests() } catch (cause) { form.querySelector('.form-error').textContent = cause.message }
  })
  guestsCard.querySelector('[data-csv]').addEventListener('change', async (changeEvent) => { const file = changeEvent.target.files[0]; if (!file) return; try { const rows = parseGuestsCsv(await file.text()).map((guest) => ({ ...guest, event_id: id })); if (rows.length > 500) throw new Error('Importa como máximo 500 invitados por archivo.'); await createGuests(rows); showToast(`${rows.length} invitados importados.`, 'success'); await refreshGuests() } catch (cause) { showToast(cause.message, 'error') } finally { changeEvent.target.value = '' } })
  await refreshGuests()

  const designCard = document.createElement('article'); designCard.className = 'card'
  designCard.innerHTML = `<h2 class="text-2xl font-bold">Personalizar invitación</h2><p class="text-sm text-slate-500">Los cambios se muestran antes de guardarlos.</p><form class="mt-6 grid gap-4" data-theme-form><label class="field">Mensaje<textarea name="invitation_message" rows="5" maxlength="1500"></textarea></label><button type="button" class="justify-self-start text-sm font-bold text-violet" data-restore>Restaurar mensaje predeterminado</button><div class="grid grid-cols-2 gap-3" data-colors></div><button class="button-primary" type="submit">Guardar diseño</button></form>`
  const themeForm = designCard.querySelector('form'); themeForm.invitation_message.value = event.invitation_message || DEFAULT_INVITATION_MESSAGE
  const colors = designCard.querySelector('[data-colors]'); const theme = sanitizeTheme(event.invitation_theme)
  THEME_FIELDS.forEach(([key, label]) => { const field = document.createElement('label'); field.className = 'color-field'; const text = document.createElement('span'); text.textContent = label; const input = document.createElement('input'); input.type = 'color'; input.name = key; input.value = theme[key]; field.append(text, input); colors.append(field) })
  const preview = document.createElement('div'); preview.className = 'invitation-shell invitation-preview'; const previewTitle = document.createElement('h3'); previewTitle.textContent = event.event_name; const previewCopy = document.createElement('p'); const previewButton = document.createElement('span'); previewButton.className = 'preview-button'; previewButton.textContent = 'Ver mi entrada'; preview.append(previewTitle, previewCopy, previewButton); designCard.append(preview)
  const updatePreview = () => { applyTheme(preview, Object.fromEntries(new FormData(themeForm))); previewCopy.textContent = renderInvitationMessage(themeForm.invitation_message.value, invitationVariables(event, 'Invitado')) }
  themeForm.addEventListener('input', updatePreview); designCard.querySelector('[data-restore]').addEventListener('click', () => { themeForm.invitation_message.value = DEFAULT_INVITATION_MESSAGE; updatePreview() })
  themeForm.addEventListener('submit', async (submitEvent) => { submitEvent.preventDefault(); try { const data = Object.fromEntries(new FormData(themeForm)); const invitation_message = data.invitation_message; delete data.invitation_message; await updateEvent(id, { invitation_message, invitation_theme: sanitizeTheme(data) }); showToast('Diseño guardado.', 'success') } catch (cause) { showToast(cause.message, 'error') } })
  updatePreview(); layout.append(guestsCard, designCard); return section
}

