import { signIn, getCurrentProfile, requestPasswordReset } from '../services/auth.js'
import { navigate } from '../router.js'
import { showToast } from '../components/toast.js'

function roleHome(role) { return role === 'superadmin' ? '/superadmin' : role === 'receptionist' ? '/recepcion' : '/admin' }

export function loginPage() {
  const main = document.createElement('main')
  main.className = 'auth-layout'
  main.innerHTML = `
    <section class="auth-panel"><a href="/" data-link class="text-2xl font-black">Qvento</a><div><span class="eyebrow">Acceso seguro</span><h1 class="mt-6 text-5xl font-semibold tracking-[-.04em]">La mejor bienvenida empieza aquí.</h1><p class="mt-5 text-slate-300">Gestiona tus invitados y recibe a cada persona con fluidez.</p></div></section>
    <section class="grid place-items-center bg-slate-50 p-6 text-slate-900"><form class="card w-full max-w-md" novalidate><h2 class="text-3xl font-bold">Iniciar sesión</h2><p class="mt-2 text-slate-500">Usa la cuenta que recibiste por invitación.</p><label class="field mt-8">Correo electrónico<input name="email" type="email" autocomplete="email" required></label><label class="field">Contraseña<input name="password" type="password" autocomplete="current-password" required minlength="8"></label><button class="button-primary mt-3 w-full" type="submit">Entrar</button><button class="mt-5 w-full text-sm font-semibold text-violet" type="button" data-reset>Olvidé mi contraseña</button><p class="form-error mt-4" role="alert"></p></form></section>`
  const form = main.querySelector('form')
  const error = main.querySelector('.form-error')
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); error.textContent = ''
    const submit = form.querySelector('[type="submit"]'); submit.disabled = true; submit.textContent = 'Ingresando…'
    try {
      const values = new FormData(form)
      await signIn(values.get('email'), values.get('password'))
      const profile = await getCurrentProfile()
      if (!profile?.is_active) throw new Error('Tu cuenta está desactivada.')
      navigate(roleHome(profile.role))
    } catch (cause) { error.textContent = cause.message } finally { submit.disabled = false; submit.textContent = 'Entrar' }
  })
  main.querySelector('[data-reset]').addEventListener('click', async () => {
    const email = form.email.value
    if (!email) return showToast('Escribe primero tu correo.', 'error')
    try { await requestPasswordReset(email); showToast('Revisa tu correo para restablecer la contraseña.', 'success') } catch (cause) { showToast(cause.message, 'error') }
  })
  return main
}

