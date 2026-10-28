import { updatePassword } from '../services/auth.js'
import { navigate } from '../router.js'

export function resetPasswordPage() {
  const main = document.createElement('main'); main.className = 'min-h-screen grid place-items-center bg-slate-50 p-6 text-slate-900'
  main.innerHTML = `<form class="card w-full max-w-md"><p class="kicker">Seguridad</p><h1 class="mt-2 text-3xl font-bold">Crea tu contraseña</h1><p class="mt-2 text-slate-500">Usa al menos 10 caracteres.</p><label class="field mt-7">Nueva contraseña<input name="password" type="password" minlength="10" autocomplete="new-password" required></label><label class="field">Confirmar contraseña<input name="confirmation" type="password" minlength="10" autocomplete="new-password" required></label><button class="button-primary mt-3 w-full">Guardar contraseña</button><p class="form-error mt-3"></p></form>`
  const form = main.querySelector('form'); form.addEventListener('submit', async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(form)); const error = form.querySelector('.form-error'); if (data.password !== data.confirmation) { error.textContent = 'Las contraseñas no coinciden.'; return } try { await updatePassword(data.password); navigate('/login') } catch (cause) { error.textContent = cause.message } })
  return main
}
