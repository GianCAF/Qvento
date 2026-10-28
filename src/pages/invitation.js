import { getPublicInvitation } from '../services/guests.js'
import { renderInvitationMessage, invitationVariables } from '../utils/template-engine.js'
import { applyTheme } from '../utils/theme-manager.js'
import { invitationUrl } from '../utils/qr-utils.js'
import { renderQr } from '../components/qr-generator.js'
import { DEFAULT_INVITATION_MESSAGE } from '../config.js'

function createArrowButton(direction) {
  const gradientId = `scene-arrow-gradient-${direction}`
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `scene-arrow scene-arrow-${direction}`
  button.setAttribute('aria-label', direction === 'previous' ? 'Ver sección anterior' : 'Ver sección siguiente')
  button.innerHTML = `
    <svg viewBox="0 0 180 80" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="0">
          <stop class="arrow-stop-primary" offset="0%" />
          <stop class="arrow-stop-secondary" offset="55%" />
          <stop class="arrow-stop-background" offset="100%" />
        </linearGradient>
      </defs>
      <path stroke="url(#${gradientId})" d="M166 41c-31-29-57 27-95 4C52 33 35 28 13 42" />
      <path stroke="url(#${gradientId})" d="m13 42 21-19M13 42l23 16" />
    </svg>`
  return button
}

export async function invitationPage(token) {
  const data = await getPublicInvitation(token)
  if (!data) throw new Error('Esta invitación no existe o ya no está disponible.')

  const main = document.createElement('main')
  main.className = 'invitation-shell min-h-screen overflow-hidden'
  applyTheme(main, data.invitation_theme)

  const track = document.createElement('div')
  track.className = 'scene-track'
  main.append(track)

  const scene = (eyebrow, title) => {
    const section = document.createElement('section')
    section.className = 'invitation-scene'
    const card = document.createElement('div')
    card.className = 'scene-card'
    const label = document.createElement('p')
    label.className = 'scene-eyebrow'
    label.textContent = eyebrow
    const heading = document.createElement('h1')
    heading.textContent = title
    card.append(label, heading)
    section.append(card)
    track.append(section)
    return card
  }

  const welcome = scene('Estás invitado', data.event_name)
  const celebrant = document.createElement('p')
  celebrant.className = 'scene-copy'
  celebrant.textContent = `Acompaña a ${data.celebrant_name} en un día inolvidable.`
  welcome.append(celebrant)

  const message = scene(`Para ${data.guest_name}`, 'Tenemos algo que celebrar')
  const copy = document.createElement('p')
  copy.className = 'scene-copy'
  copy.textContent = renderInvitationMessage(
    data.invitation_message || DEFAULT_INVITATION_MESSAGE,
    invitationVariables(data, data.guest_name),
  )
  message.append(copy)

  const eventDate = new Date(data.event_date)
  const details = scene('Agenda la fecha', new Intl.DateTimeFormat('es-MX', { dateStyle: 'full' }).format(eventDate))
  const detailCopy = document.createElement('p')
  detailCopy.className = 'scene-copy'
  detailCopy.textContent = `${new Intl.DateTimeFormat('es-MX', { timeStyle: 'short' }).format(eventDate)} · ${data.event_address}`
  details.append(detailCopy)
  if (data.event_description) {
    const description = document.createElement('p')
    description.className = 'mt-4'
    description.textContent = data.event_description
    details.append(description)
  }

  const pass = scene('Entrada digital', data.guest_name)
  pass.parentElement.classList.add('qr-scene')
  const canvas = document.createElement('canvas')
  canvas.className = 'qr-canvas'
  pass.append(canvas)
  await renderQr(canvas, invitationUrl(token))

  const scenes = [...track.querySelectorAll('.invitation-scene')]
  const previous = createArrowButton('previous')
  const next = createArrowButton('next')
  let current = 0
  let transitioning = false
  let transitionFallback

  const update = () => {
    track.style.transform = `translateX(-${current * 100}%)`
    previous.hidden = current === 0
    next.hidden = current === scenes.length - 1
    window.requestAnimationFrame(() => {
      track.style.height = `${scenes[current].scrollHeight}px`
    })
  }

  const finishTransition = () => {
    if (!transitioning) return
    transitioning = false
    window.clearTimeout(transitionFallback)
    main.classList.remove('is-transitioning')
    previous.disabled = false
    next.disabled = false
    update()
  }

  const goTo = (target) => {
    if (transitioning || target === current || target < 0 || target >= scenes.length) return
    transitioning = true
    previous.disabled = true
    next.disabled = true
    main.classList.add('is-transitioning')
    current = target
    update()
    transitionFallback = window.setTimeout(finishTransition, 850)
  }

  previous.addEventListener('click', () => {
    goTo(current - 1)
  })
  next.addEventListener('click', () => {
    goTo(current + 1)
  })
  track.addEventListener('transitionend', (event) => {
    if (event.propertyName === 'transform') finishTransition()
  })
  main.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' && current > 0) previous.click()
    if (event.key === 'ArrowRight' && current < scenes.length - 1) next.click()
  })

  const resizeObserver = new ResizeObserver(update)
  scenes.forEach((item) => resizeObserver.observe(item))
  main.append(previous, next)
  update()
  return main
}
