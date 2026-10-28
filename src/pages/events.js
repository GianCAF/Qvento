import { createEvent, listEvents } from '../services/events.js'
import { DEFAULT_INVITATION_MESSAGE, DEFAULT_THEME } from '../config.js'
import { requiredText, optionalText } from '../utils/validators.js'
import { navigate } from '../router.js'
import { showToast } from '../components/toast.js'

export async function eventsPage() {
  const section = document.createElement('section')
  section.innerHTML = `<div class="page-heading"><div><p class="kicker">Eventos</p><h1>Momentos por celebrar</h1><p>Configura, comparte y consulta cada evento.</p></div><a class="button-primary" href="/admin/eventos/nuevo" data-link>Crear evento</a></div>`
  const grid = document.createElement('div'); grid.className = 'mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3'; section.append(grid)
  const events = await listEvents()
  if (!events.length) { const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'Todavía no hay eventos. Crea el primero para comenzar.'; grid.append(empty); return section }
  events.forEach((event) => {
    const article = document.createElement('article'); article.className = 'event-card'
    const date = document.createElement('p'); date.className = 'kicker'; date.textContent = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(new Date(event.event_date))
    const title = document.createElement('h2'); title.className = 'mt-4 text-2xl font-bold'; title.textContent = event.event_name
    const celebrant = document.createElement('p'); celebrant.className = 'mt-2 text-slate-500'; celebrant.textContent = `Para ${event.celebrant_name}`
    const address = document.createElement('p'); address.className = 'mt-6 line-clamp-2 text-sm'; address.textContent = event.event_address
    const link = document.createElement('a'); link.className = 'mt-6 inline-flex font-bold text-violet'; link.href = `/admin/eventos/${event.id}`; link.dataset.link = ''; link.textContent = 'Administrar evento →'
    article.append(date, title, celebrant, address, link); grid.append(article)
  })
  return section
}

export function newEventPage() {
  const section = document.createElement('section')
  section.innerHTML = `<div class="page-heading"><div><p class="kicker">Nuevo evento</p><h1>Diseña una nueva celebración</h1><p>Los detalles podrán editarse después.</p></div></div>
  <form class="card mt-8 grid gap-5 lg:grid-cols-2" novalidate>
    <label class="field">Nombre del festejado<input name="celebrant_name" required maxlength="120"></label>
    <label class="field">Nombre del evento<input name="event_name" required maxlength="160"></label>
    <label class="field">Fecha y hora<input name="event_date" type="datetime-local" required></label>
    <label class="field">Dirección<input name="event_address" required maxlength="300"></label>
    <label class="field lg:col-span-2">Código de vestimenta<input name="dress_code" maxlength="120" placeholder="Ej. Formal, coctel o tonos claros"></label>
    <label class="field lg:col-span-2">Descripción<textarea name="event_description" rows="3" maxlength="1000"></textarea></label>
    <label class="field lg:col-span-2">Mensaje de invitación<textarea name="invitation_message" rows="5" maxlength="1500"></textarea></label>
    <div class="lg:col-span-2 flex justify-end gap-3"><a class="button-secondary" href="/admin/eventos" data-link>Cancelar</a><button class="button-primary" type="submit">Crear evento</button></div>
    <p class="form-error lg:col-span-2" role="alert"></p>
  </form>`
  const form = section.querySelector('form'); form.invitation_message.value = DEFAULT_INVITATION_MESSAGE
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); const button = form.querySelector('[type="submit"]'); button.disabled = true
    try {
      const data = Object.fromEntries(new FormData(form))
      const created = await createEvent({
        celebrant_name: requiredText(data.celebrant_name, 'El festejado', 120), event_name: requiredText(data.event_name, 'El evento', 160),
        event_date: new Date(data.event_date).toISOString(), event_address: requiredText(data.event_address, 'La dirección', 300),
        event_description: optionalText(data.event_description), dress_code: optionalText(data.dress_code, 120),
        invitation_message: optionalText(data.invitation_message, 1500) ?? DEFAULT_INVITATION_MESSAGE,
        invitation_theme: DEFAULT_THEME,
      })
      showToast('Evento creado correctamente.', 'success'); navigate(`/admin/eventos/${created.id}`)
    } catch (cause) { form.querySelector('.form-error').textContent = cause.message } finally { button.disabled = false }
  })
  return section
}

