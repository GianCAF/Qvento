const LINKS = {
  superadmin: [['/superadmin', 'Dashboard'], ['/superadmin/administradores', 'Administradores'], ['/admin/eventos', 'Eventos'], ['/superadmin/estadisticas', 'Estadísticas']],
  admin: [['/admin', 'Resumen'], ['/admin/eventos', 'Mis eventos'], ['/admin/eventos/nuevo', 'Crear evento'], ['/admin/recepcionistas', 'Recepcionistas'], ['/admin/estadisticas', 'Estadísticas']],
  receptionist: [['/recepcion', 'Escanear accesos']],
}

export function createSidebar(profile) {
  const aside = document.createElement('aside')
  aside.className = 'app-sidebar'
  const brand = document.createElement('a')
  brand.href = '/'
  brand.dataset.link = ''
  brand.className = 'text-2xl font-black tracking-[-.05em]'
  brand.textContent = 'Qvento'
  const nav = document.createElement('nav')
  nav.className = 'mt-10 grid gap-2'
  nav.setAttribute('aria-label', 'Navegación principal')
  ;(LINKS[profile.role] ?? []).forEach(([href, label]) => {
    const link = document.createElement('a')
    link.href = href
    link.dataset.link = ''
    link.className = `nav-link ${location.pathname === href ? 'nav-link-active' : ''}`
    link.textContent = label
    nav.append(link)
  })
  aside.append(brand, nav)
  return aside
}

