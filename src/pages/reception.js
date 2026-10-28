import { listEvents } from '../services/events.js'
import { prevalidate, confirmCheckIn } from '../services/check-in.js'
import { tokenFromQrText } from '../utils/qr-utils.js'
import { QrScanner } from '../components/qr-scanner.js'
import { showToast } from '../components/toast.js'

const STATUS_COPY = { available: 'Entrada disponible', used: 'Esta entrada ya fue utilizada', revoked: 'Esta entrada fue revocada', invalid: 'Código inválido', unauthorized: 'No tienes autorización para este evento' }

export async function receptionPage() {
  const section = document.createElement('section')
  section.innerHTML = `<div class="page-heading"><div><p class="kicker">Recepción</p><h1>Validar una entrada</h1><p>Escanear consulta el estado; el ingreso requiere confirmación.</p></div></div><div class="mt-8 grid gap-6 lg:grid-cols-[1fr_.8fr]"><article class="card"><label class="field">Evento<select data-event></select></label><div id="qr-reader" class="mt-5 overflow-hidden rounded-2xl bg-slate-950"></div><div class="mt-5 flex gap-3"><button class="button-primary" data-start>Activar cámara</button><button class="button-secondary" data-stop disabled>Detener</button></div><p class="mt-4 text-sm text-slate-500">La cámara requiere HTTPS o localhost y permiso del dispositivo.</p></article><article class="card grid content-start gap-5"><div><p class="kicker">Resultado</p><h2 class="mt-2 text-2xl font-bold" data-name>Esperando lectura</h2><p class="mt-2 text-slate-500" data-status>Activa la cámara y acerca el código al marco.</p></div><div class="flex gap-3"><button class="button-primary" data-confirm disabled>Confirmar ingreso</button><button class="button-secondary" data-cancel disabled>Cancelar</button></div></article></div>`
  const select = section.querySelector('[data-event]'); const events = await listEvents()
  events.forEach((event) => { const option = document.createElement('option'); option.value = event.id; option.textContent = `${event.event_name} · ${new Intl.DateTimeFormat('es-MX').format(new Date(event.event_date))}`; select.append(option) })
  if (!events.length) { select.append(new Option('No hay eventos asignados', '')); select.disabled = true; section.querySelector('[data-start]').disabled = true }
  const name = section.querySelector('[data-name]'); const status = section.querySelector('[data-status]'); const confirm = section.querySelector('[data-confirm]'); const cancel = section.querySelector('[data-cancel]'); let scanner; let currentToken
  const reset = () => { currentToken = null; name.textContent = 'Esperando lectura'; status.textContent = 'Acerca un código QR al marco.'; confirm.disabled = true; cancel.disabled = true; scanner?.resume() }
  const handleScan = async (text) => {
    currentToken = tokenFromQrText(text)
    if (!currentToken) { name.textContent = 'Código no reconocido'; status.textContent = STATUS_COPY.invalid; cancel.disabled = false; return }
    try { const result = await prevalidate(select.value, currentToken); name.textContent = result?.guest_name || 'Sin invitado'; status.textContent = STATUS_COPY[result?.status] || result?.status; confirm.disabled = result?.status !== 'available'; cancel.disabled = false } catch { status.textContent = 'Error de conexión. No se realizó ningún ingreso.'; cancel.disabled = false }
  }
  section.querySelector('[data-start]').addEventListener('click', async (event) => { try { scanner ??= new QrScanner('qr-reader', handleScan); await scanner.start(); event.currentTarget.disabled = true; section.querySelector('[data-stop]').disabled = false } catch (cause) { showToast(`No fue posible iniciar la cámara: ${cause.message}`, 'error') } })
  section.querySelector('[data-stop]').addEventListener('click', async (event) => { await scanner?.stop(); event.currentTarget.disabled = true; section.querySelector('[data-start]').disabled = false })
  cancel.addEventListener('click', reset)
  confirm.addEventListener('click', async () => { confirm.disabled = true; try { const result = await confirmCheckIn(select.value, currentToken); status.textContent = result?.status === 'confirmed' ? 'Ingreso confirmado correctamente' : STATUS_COPY[result?.status] || 'No fue posible confirmar'; if (result?.status === 'confirmed') showToast('Ingreso registrado.', 'success'); cancel.textContent = 'Escanear siguiente' } catch { status.textContent = 'Error de conexión. El ingreso no fue confirmado.' } })
  return section
}

