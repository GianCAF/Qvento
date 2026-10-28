import { homePage } from './pages/home.js'
import { loginPage } from './pages/login.js'
import { dashboardPage } from './pages/dashboard.js'
import { eventsPage, newEventPage } from './pages/events.js'
import { adminsPage } from './pages/superadmin.js'
import { receptionistsPage } from './pages/receptionists.js'
import { statisticsPage } from './pages/statistics.js'
import { errorPage } from './pages/error.js'
import { resetPasswordPage } from './pages/reset-password.js'
import { createAppShell } from './components/app-shell.js'
import { getCurrentProfile } from './services/auth.js'
import { isSupabaseConfigured } from './services/supabase.js'
import { clearDynamicImportRecovery, isDynamicImportFailure, reloadAfterDynamicImportFailure } from './utils/chunk-recovery.js'

const app = document.querySelector('#app')

const routes = [
  { pattern: /^\/$/, page: homePage, public: true },
  { pattern: /^\/login\/?$/, page: loginPage, public: true },
  { pattern: /^\/restablecer\/?$/, page: resetPasswordPage, public: true },
  { pattern: /^\/invitacion\/([0-9a-f]{64})\/?$/i, page: async (_, match) => (await import('./pages/invitation.js')).invitationPage(match[1]), public: true },
  { pattern: /^\/restablecer\/?$/, page: resetPasswordPage, public: true },
  { pattern: /^\/superadmin\/?$/, page: dashboardPage, roles: ['superadmin'] },
  { pattern: /^\/superadmin\/administradores\/?$/, page: adminsPage, roles: ['superadmin'] },
  { pattern: /^\/superadmin\/estadisticas\/?$/, page: statisticsPage, roles: ['superadmin'] },
  { pattern: /^\/admin\/?$/, page: dashboardPage, roles: ['admin', 'superadmin'] },
  { pattern: /^\/admin\/eventos\/?$/, page: eventsPage, roles: ['admin', 'superadmin'] },
  { pattern: /^\/admin\/eventos\/nuevo\/?$/, page: newEventPage, roles: ['admin', 'superadmin'] },
  { pattern: /^\/admin\/eventos\/([0-9a-f-]{36})\/?$/i, page: async (_, match) => (await import('./pages/event-detail.js')).eventDetailPage(match[1]), roles: ['admin', 'superadmin'] },
  { pattern: /^\/admin\/recepcionistas\/?$/, page: receptionistsPage, roles: ['admin', 'superadmin'] },
  { pattern: /^\/admin\/estadisticas\/?$/, page: statisticsPage, roles: ['admin', 'superadmin'] },
  { pattern: /^\/recepcion\/?$/, page: async () => (await import('./pages/reception.js')).receptionPage(), roles: ['receptionist', 'admin', 'superadmin'] },
]

export function navigate(path) { history.pushState({}, '', path); renderRoute() }

export async function renderRoute() {
  document.documentElement.classList.remove('invitation-page-root', 'has-animated-background')
  document.documentElement.removeAttribute('data-animation-style')
  document.body.classList.remove('invitation-page')
  app.replaceChildren(); app.className = ''
  const loading = document.createElement('div'); loading.className = 'min-h-screen grid place-items-center bg-ink text-white'; loading.textContent = 'Cargando Qvento…'; app.append(loading)
  const route = routes.find((candidate) => candidate.pattern.test(location.pathname))
  if (!route) { app.replaceChildren(errorPage()); return }
  try {
    let profile = null
    if (!route.public) {
      if (!isSupabaseConfigured) throw new Error('Supabase aún no está configurado. Copia .env.example como .env y agrega las claves públicas del proyecto.')
      profile = await getCurrentProfile()
      if (!profile) { navigate(`/login?return=${encodeURIComponent(location.pathname)}`); return }
      if (!profile.is_active || !route.roles.includes(profile.role)) { app.replaceChildren(errorPage('Acceso restringido', 'Tu cuenta no tiene permisos para abrir esta sección.')); return }
    }
    const match = location.pathname.match(route.pattern)
    const content = await route.page(profile, match)
    app.replaceChildren(profile ? createAppShell(profile, content) : content)
    clearDynamicImportRecovery()
    window.scrollTo({ top: 0, behavior: 'instant' })
  } catch (cause) {
    if (reloadAfterDynamicImportFailure(cause)) return
    const detail = isDynamicImportFailure(cause)
      ? 'La aplicación se actualizó mientras estaba abierta. Recarga la página para obtener la versión más reciente.'
      : cause.message
    app.replaceChildren(errorPage('No pudimos cargar esta sección', detail))
  }
}

document.addEventListener('click', (event) => { const link = event.target.closest('a[data-link]'); if (!link || event.ctrlKey || event.metaKey || link.target === '_blank') return; event.preventDefault(); navigate(link.getAttribute('href')) })
window.addEventListener('popstate', renderRoute)

