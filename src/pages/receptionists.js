import { createManagedUser } from '../services/admins.js'
import { listEvents } from '../services/events.js'
import { assignReceptionist, listAssignments, listReceptionists, removeAssignment } from '../services/receptionists.js'
import { requiredText } from '../utils/validators.js'
import { showToast } from '../components/toast.js'

export async function receptionistsPage() {
  const section = document.createElement('section')
  section.innerHTML = `<div class="page-heading"><div><p class="kicker">Equipo</p><h1>Recepcionistas</h1><p>Crea cuentas y limita su acceso a eventos concretos.</p></div></div><div class="mt-8 grid gap-6 xl:grid-cols-2"><form class="card grid gap-4" data-create><h2 class="text-xl font-bold">Invitar recepcionista</h2><label class="field">Nombre<input name="full_name" required></label><label class="field">Correo<input name="email" type="email" required></label><button class="button-primary" type="submit">Enviar invitación</button><p class="form-error"></p></form><form class="card grid gap-4" data-assign><h2 class="text-xl font-bold">Asignar evento</h2><label class="field">Recepcionista<select name="receptionist_id"></select></label><label class="field">Evento<select name="event_id"></select></label><button class="button-primary" type="submit">Asignar</button></form></div><div class="card mt-6"><h2 class="text-xl font-bold">Asignaciones activas</h2><div class="mt-5 grid gap-3" data-list></div></div>`
  const createForm = section.querySelector('[data-create]'); const assignForm = section.querySelector('[data-assign]'); const list = section.querySelector('[data-list]')
  const populate = async () => {
    const [people, events] = await Promise.all([listReceptionists(), listEvents()]); assignForm.receptionist_id.replaceChildren(); assignForm.event_id.replaceChildren()
    people.forEach((person) => assignForm.receptionist_id.add(new Option(person.full_name, person.id))); events.forEach((event) => assignForm.event_id.add(new Option(event.event_name, event.id)))
    assignForm.querySelector('button').disabled = !people.length || !events.length
  }
  const refresh = async () => { list.replaceChildren(); const rows = await listAssignments(); if (!rows.length) { const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'No hay asignaciones.'; list.append(empty) } rows.forEach((item) => { const row = document.createElement('div'); row.className = 'list-row'; const text = document.createElement('p'); text.textContent = `${item.profiles?.full_name || 'Recepcionista'} · ${item.events?.event_name || 'Evento'}`; const remove = Object.assign(document.createElement('button'), { className: 'button-small button-danger', textContent: 'Retirar acceso' }); remove.addEventListener('click', async () => { await removeAssignment(item.id); showToast('Acceso retirado inmediatamente.', 'success'); await refresh() }); row.append(text, remove); list.append(row) }) }
  createForm.addEventListener('submit', async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(createForm)); try { await createManagedUser({ full_name: requiredText(data.full_name, 'El nombre', 120), email: requiredText(data.email, 'El correo', 254), role: 'receptionist' }); createForm.reset(); showToast('Invitación enviada.', 'success'); await populate() } catch (cause) { createForm.querySelector('.form-error').textContent = cause.message } })
  assignForm.addEventListener('submit', async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(assignForm)); try { await assignReceptionist(data.event_id, data.receptionist_id); showToast('Recepcionista asignado.', 'success'); await refresh() } catch (cause) { showToast(cause.message, 'error') } })
  await Promise.all([populate(), refresh()]); return section
}

