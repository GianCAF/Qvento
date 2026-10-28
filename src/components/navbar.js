import { signOut } from '../services/auth.js'
import { navigate } from '../router.js'

export function createNavbar(profile) {
  const header = document.createElement('header')
  header.className = 'app-navbar'
  const identity = document.createElement('div')
  const name = document.createElement('p')
  name.className = 'font-semibold'
  name.textContent = profile.full_name
  const role = document.createElement('p')
  role.className = 'text-xs uppercase tracking-widest text-slate-400'
  role.textContent = profile.role
  identity.append(name, role)
  const button = document.createElement('button')
  button.className = 'button-secondary'
  button.textContent = 'Cerrar sesión'
  button.addEventListener('click', async () => { await signOut(); navigate('/login') })
  header.append(identity, button)
  return header
}

