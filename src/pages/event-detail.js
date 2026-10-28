import { getEvent, updateEvent } from '../services/events.js'
import { createGuest, createGuests, issueInvitation, listGuests, updateGuest } from '../services/guests.js'
import { BACKGROUND_PRESETS, DEFAULT_INVITATION_MESSAGE, THEME_FIELDS } from '../config.js'
import { renderInvitationMessage, invitationVariables } from '../utils/template-engine.js'
import { applyTheme, buildBackgroundDesign, sanitizeTheme } from '../utils/theme-manager.js'
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

function createColorField(key, label, value) {
  const field = document.createElement('label')
  field.className = 'color-field'
  const text = document.createElement('span')
  text.textContent = label
  const input = document.createElement('input')
  input.type = 'color'
  input.name = key
  input.value = value
  field.append(text, input)
  return field
}

function createBackgroundControls(theme) {
  const fieldset = document.createElement('fieldset')
  fieldset.className = 'background-controls'
  const legend = document.createElement('legend')
  legend.className = 'text-lg font-bold'
  legend.textContent = 'Diseño del fondo'
  const description = document.createElement('p')
  description.className = 'mt-1 text-sm text-slate-500'
  description.textContent = 'Elige un estilo y combina los colores que utiliza.'
  const gallery = document.createElement('div')
  gallery.className = 'background-preset-grid mt-4'

  const cards = BACKGROUND_PRESETS.map((preset) => {
    const card = document.createElement('label')
    card.className = 'background-preset-card'
    const input = document.createElement('input')
    input.type = 'radio'
    input.name = 'background_style'
    input.value = preset.value
    input.checked = preset.value === theme.background_style
    const swatch = document.createElement('span')
    swatch.className = 'background-preset-swatch'
    const name = document.createElement('strong')
    name.textContent = preset.label
    const count = document.createElement('small')
    count.textContent = preset.colors === 1 ? '1 color' : `${preset.colors} colores`
    card.append(input, swatch, name, count)
    gallery.append(card)
    return { preset, swatch }
  })

  const colorGrid = document.createElement('div')
  colorGrid.className = 'mt-4 grid gap-3 sm:grid-cols-3'
  const colorFields = [
    createColorField('background_color_1', 'Color 1', theme.background_color_1),
    createColorField('background_color_2', 'Color 2', theme.background_color_2),
    createColorField('background_color_3', 'Color 3', theme.background_color_3),
  ]
  colorGrid.append(...colorFields)
  const hint = document.createElement('p')
  hint.className = 'mt-3 text-xs font-semibold text-violet'

  const sync = () => {
    const selected = BACKGROUND_PRESETS.find(({ value }) => fieldset.querySelector(`[name="background_style"][value="${value}"]`)?.checked) ?? BACKGROUND_PRESETS[1]
    colorFields.forEach((field, index) => { field.hidden = index >= selected.colors })
    hint.textContent = selected.colors === 1
      ? 'Este diseño utiliza un color.'
      : `Este diseño combina ${selected.colors} colores.`
    const current = sanitizeTheme({
      ...theme,
      background_color_1: colorFields[0].querySelector('input').value,
      background_color_2: colorFields[1].querySelector('input').value,
      background_color_3: colorFields[2].querySelector('input').value,
    })
    cards.forEach(({ preset, swatch }) => {
      swatch.style.backgroundColor = current.background_color_1
      swatch.style.backgroundImage = buildBackgroundDesign({ ...current, background_style: preset.value })
    })
  }

  fieldset.addEventListener('input', sync)
  fieldset.append(legend, description, gallery, colorGrid, hint)
  sync()
  return { element: fieldset, sync }
}

export async function eventDetailPage(id) {
  const event = await getEvent(id)
  const section = document.createElement('section')
  const heading = document.createElement('div'); heading.className = 'page-heading'
  const titleBox = document.createElement('div'); const kicker = document.createElement('p'); kicker.className = 'kicker'; kicker.textContent = 'Administrar evento'
  const title = document.createElement('h1'); title.textContent = event.event_name
  const sub = document.createElement('p'); sub.textContent = `${new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(event.event_date))} · ${event.event_address}`
  const openPreview = Object.assign(document.createElement('button'), { type: 'button', className: 'button-primary', textContent: 'Previsualizar invitación' })
  titleBox.append(kicker, title, sub); heading.append(titleBox, openPreview); section.append(heading)

  const layout = document.createElement('div'); layout.className = 'mt-8 grid gap-6 xl:grid-cols-[1.1fr_.9fr]'; section.append(layout)
  const guestsCard = document.createElement('article'); guestsCard.className = 'card'
  guestsCard.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-2xl font-bold">Invitados</h2><p class="text-sm text-slate-500">Emite enlaces individuales y controla su estado.</p></div><label class="button-secondary cursor-pointer">Importar CSV<input class="sr-only" type="file" accept=".csv,text/csv" data-csv></label></div>
    <form class="mt-6 grid gap-3 sm:grid-cols-2" data-guest-form><label class="field">Nombre<input name="full_name" required maxlength="160"></label><label class="field">Correo<input name="email" type="email"></label><label class="field">Teléfono<input name="phone" type="tel"></label><div class="flex items-end"><button class="button-primary w-full" type="submit">Agregar invitado</button></div><p class="form-error sm:col-span-2"></p></form>
    <div class="guest-list-toolbar mt-7"><label class="field guest-search">Buscar por nombre o apellido<input type="search" data-guest-search placeholder="Ej. Ana Pérez" autocomplete="off"></label><label class="field">Orden<select data-guest-sort><option value="asc">A–Z</option><option value="desc">Z–A</option></select></label><label class="field">Mostrar<select data-guest-size><option value="10">10</option><option value="25">25</option></select></label></div>`
  const list = document.createElement('div'); list.className = 'mt-6 grid gap-3'; guestsCard.append(list)
  const pagination = document.createElement('div'); pagination.className = 'guest-pagination mt-4'
  const summary = document.createElement('p'); summary.className = 'text-sm text-slate-500'
  const pageActions = document.createElement('div'); pageActions.className = 'flex gap-2'
  const previousPage = Object.assign(document.createElement('button'), { type: 'button', className: 'button-small', textContent: 'Anterior' })
  const nextPage = Object.assign(document.createElement('button'), { type: 'button', className: 'button-small', textContent: 'Siguiente' })
  pageActions.append(previousPage, nextPage); pagination.append(summary, pageActions); guestsCard.append(pagination)
  const guestState = { search: '', sort: 'asc', page: 1, pageSize: 10 }
  const refreshGuests = async () => {
    list.setAttribute('aria-busy', 'true')
    const result = await listGuests(id, guestState)
    const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))
    if (guestState.page > totalPages) { guestState.page = totalPages; return refreshGuests() }
    list.replaceChildren()
    if (!result.guests.length) {
      const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = guestState.search ? 'No encontramos invitados con ese nombre o apellido.' : 'Aún no hay invitados.'; list.append(empty)
    } else result.guests.forEach((guest) => list.append(guestRow(guest, refreshGuests)))
    const first = result.total ? ((guestState.page - 1) * result.pageSize) + 1 : 0
    const last = Math.min(guestState.page * result.pageSize, result.total)
    summary.textContent = `${first}–${last} de ${result.total} invitados`
    previousPage.disabled = guestState.page === 1
    nextPage.disabled = guestState.page >= totalPages
    list.removeAttribute('aria-busy')
  }
  let searchTimer
  guestsCard.querySelector('[data-guest-search]').addEventListener('input', (inputEvent) => {
    window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(async () => { guestState.search = inputEvent.target.value.trim(); guestState.page = 1; await refreshGuests() }, 250)
  })
  guestsCard.querySelector('[data-guest-sort]').addEventListener('change', async (changeEvent) => { guestState.sort = changeEvent.target.value; guestState.page = 1; await refreshGuests() })
  guestsCard.querySelector('[data-guest-size]').addEventListener('change', async (changeEvent) => { guestState.pageSize = Number(changeEvent.target.value); guestState.page = 1; await refreshGuests() })
  previousPage.addEventListener('click', async () => { guestState.page -= 1; await refreshGuests() })
  nextPage.addEventListener('click', async () => { guestState.page += 1; await refreshGuests() })
  guestsCard.querySelector('form').addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault(); const form = submitEvent.currentTarget
    try { const data = Object.fromEntries(new FormData(form)); await createGuest({ event_id: id, full_name: requiredText(data.full_name, 'El nombre', 160), email: optionalText(data.email, 254), phone: optionalText(data.phone, 30) }); form.reset(); guestState.page = 1; showToast('Invitado agregado.', 'success'); await refreshGuests() } catch (cause) { form.querySelector('.form-error').textContent = cause.message }
  })
  guestsCard.querySelector('[data-csv]').addEventListener('change', async (changeEvent) => { const file = changeEvent.target.files[0]; if (!file) return; try { const rows = parseGuestsCsv(await file.text()).map((guest) => ({ ...guest, event_id: id })); if (rows.length > 500) throw new Error('Importa como máximo 500 invitados por archivo.'); await createGuests(rows); guestState.page = 1; showToast(`${rows.length} invitados importados.`, 'success'); await refreshGuests() } catch (cause) { showToast(cause.message, 'error') } finally { changeEvent.target.value = '' } })
  await refreshGuests()

  const designCard = document.createElement('article'); designCard.className = 'card'
  designCard.innerHTML = `<h2 class="text-2xl font-bold">Personalizar invitación</h2><p class="text-sm text-slate-500">Los cambios se muestran antes de guardarlos.</p><form class="mt-6 grid gap-5" data-theme-form><label class="field">Mensaje<textarea name="invitation_message" rows="5" maxlength="1500"></textarea></label><button type="button" class="justify-self-start text-sm font-bold text-violet" data-restore>Restaurar mensaje predeterminado</button><div class="grid grid-cols-2 gap-3" data-colors></div><button class="button-primary" type="submit">Guardar diseño</button></form>`
  const themeForm = designCard.querySelector('form'); themeForm.invitation_message.value = event.invitation_message || DEFAULT_INVITATION_MESSAGE
  const colors = designCard.querySelector('[data-colors]'); const theme = sanitizeTheme(event.invitation_theme)
  THEME_FIELDS.forEach(([key, label]) => colors.append(createColorField(key, label, theme[key])))
  const backgroundControls = createBackgroundControls(theme)
  colors.before(backgroundControls.element)
  const preview = document.createElement('div'); preview.className = 'invitation-shell invitation-preview'
  const previewScene = document.createElement('div'); previewScene.className = 'invitation-preview-scene'
  const previewCard = document.createElement('div'); previewCard.className = 'invitation-preview-card'
  const previewEyebrow = document.createElement('p'); previewEyebrow.className = 'scene-eyebrow'; previewEyebrow.textContent = 'Vista previa'
  const previewTitle = document.createElement('h3'); previewTitle.textContent = event.event_name
  const previewCopy = document.createElement('p'); previewCopy.className = 'preview-copy'
  const previewButton = document.createElement('span'); previewButton.className = 'preview-button'; previewButton.textContent = 'Ver mi entrada'
  previewCard.append(previewEyebrow, previewTitle, previewCopy, previewButton); previewScene.append(previewCard); preview.append(previewScene)
  const updatePreview = () => { backgroundControls.sync(); applyTheme(preview, Object.fromEntries(new FormData(themeForm))); previewCopy.textContent = renderInvitationMessage(themeForm.invitation_message.value, invitationVariables(event, 'Invitado')) }
  themeForm.addEventListener('input', updatePreview); designCard.querySelector('[data-restore]').addEventListener('click', () => { themeForm.invitation_message.value = DEFAULT_INVITATION_MESSAGE; updatePreview() })
  openPreview.addEventListener('click', () => {
    updatePreview()
    createModal({ title: 'Previsualización de la invitación', content: preview, confirmLabel: 'Cerrar', dialogClass: 'preview-modal' })
  })
  themeForm.addEventListener('submit', async (submitEvent) => { submitEvent.preventDefault(); try { const data = Object.fromEntries(new FormData(themeForm)); const invitation_message = data.invitation_message; delete data.invitation_message; await updateEvent(id, { invitation_message, invitation_theme: sanitizeTheme(data) }); showToast('Diseño guardado.', 'success') } catch (cause) { showToast(cause.message, 'error') } })
  updatePreview(); layout.append(guestsCard, designCard); return section
}

