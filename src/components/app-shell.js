import { createSidebar } from './sidebar.js'
import { createNavbar } from './navbar.js'

export function createAppShell(profile, content) {
  const shell = document.createElement('div')
  shell.className = 'app-shell'
  const main = document.createElement('div')
  main.className = 'min-w-0'
  main.append(createNavbar(profile))
  const area = document.createElement('main')
  area.id = 'main-content'
  area.className = 'p-5 sm:p-8'
  area.append(content)
  main.append(area)
  shell.append(createSidebar(profile), main)
  return shell
}

