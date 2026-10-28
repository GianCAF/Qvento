import { getPublicInvitation } from '../services/guests.js'
import { renderInvitationMessage, invitationVariables } from '../utils/template-engine.js'
import { applyTheme } from '../utils/theme-manager.js'
import { invitationUrl } from '../utils/qr-utils.js'
import { renderQr } from '../components/qr-generator.js'
import { DEFAULT_INVITATION_MESSAGE } from '../config.js'
import { renderDropCap } from '../utils/editorial-text.js'
import { renderAnimatedBackground } from '../components/animated-background.js'

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
          <stop class="arrow-stop-primary-dark" offset="0%" />
          <stop class="arrow-stop-primary" offset="52%" />
          <stop class="arrow-stop-primary-light" offset="100%" />
        </linearGradient>
      </defs>
      <path stroke="url(#${gradientId})" d="M166 41c-31-29-57 27-95 4C52 33 35 28 13 42" />
      <path stroke="url(#${gradientId})" d="m13 42 21-19M13 42l23 16" />
    </svg>`
  return button
}

function getInitials(name) {
  const words = String(name).trim().split(/\s+/).filter(Boolean)
  return `${words[0]?.[0] ?? ''}${words.at(-1)?.[0] ?? ''}`.toUpperCase()
}

function applyEditorialTitle(heading) {
  heading.classList.add('editorial-title')
  const firstLine = document.createElement('span')
  firstLine.textContent = 'Tenemos algo'
  const secondLine = document.createElement('span')
  secondLine.textContent = 'que celebrar'
  heading.replaceChildren(firstLine, secondLine)
}

export async function invitationPage(token) {
  const data = await getPublicInvitation(token)
  if (!data) throw new Error('Esta invitación no existe o ya no está disponible.')

  const main = document.createElement('main')
  main.className = 'invitation-shell min-h-screen overflow-hidden'
  const theme = applyTheme(main, data.invitation_theme)
  applyTheme(document.documentElement, theme)
  document.documentElement.classList.add('invitation-page-root')
  document.body.classList.add('invitation-page')

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
    renderAnimatedBackground(section, theme.animation_style)
    track.append(section)
    return card
  }

  const welcome = scene('Estás invitado', data.event_name)
  const celebrant = document.createElement('p')
  celebrant.className = 'scene-copy'
  celebrant.textContent = `Acompaña a ${data.celebrant_name} en un día inolvidable.`
  welcome.append(celebrant)

  const message = scene('Pase personal de honor', 'Tenemos algo que celebrar')
  message.classList.add('message-card')
  message.parentElement.classList.add('message-scene')
  const messageHeading = message.querySelector('h1')
  applyEditorialTitle(messageHeading)
  const monogram = document.createElement('span')
  monogram.className = 'scene-monogram'
  monogram.setAttribute('aria-hidden', 'true')
  monogram.textContent = getInitials(data.celebrant_name)
  const honoree = document.createElement('p')
  honoree.className = 'scene-honoree'
  honoree.textContent = data.guest_name
  const divider = document.createElement('span')
  divider.className = 'scene-divider'
  divider.setAttribute('aria-hidden', 'true')
  message.prepend(monogram)
  messageHeading.before(honoree)
  messageHeading.after(divider)
  const copy = document.createElement('p')
  copy.className = 'scene-copy'
  renderDropCap(copy, renderInvitationMessage(
    data.invitation_message || DEFAULT_INVITATION_MESSAGE,
    invitationVariables(data, data.guest_name),
  ))
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
  if (data.dress_code) {
    const dressCode = document.createElement('p')
    dressCode.className = 'dress-code'
    const label = document.createElement('strong')
    label.textContent = 'Código de vestimenta:'
    dressCode.append(label, ` ${data.dress_code}`)
    details.append(dressCode)
  }

  const pass = scene('Entrada digital', data.guest_name)
  pass.parentElement.classList.add('qr-scene')
  const partySize = Number.isInteger(Number(data.party_size)) ? Number(data.party_size) : 1
  const capacity = document.createElement('p')
  capacity.className = 'pass-capacity'
  capacity.textContent = `Pase válido para ${partySize} ${partySize === 1 ? 'persona' : 'personas'}`
  const canvas = document.createElement('canvas')
  canvas.className = 'qr-canvas'
  const instruction = document.createElement('p')
  instruction.className = 'pass-instruction'
  instruction.textContent = 'Presenta esta imagen en la entrada del salón.'
  pass.append(capacity, canvas, instruction)
  await renderQr(canvas, invitationUrl(token))

  const scenes = [...track.querySelectorAll('.invitation-scene')]
  const previous = createArrowButton('previous')
  const next = createArrowButton('next')
  const navigation = document.createElement('nav')
  navigation.className = 'scene-navigation'
  navigation.setAttribute('aria-label', 'Secciones de la invitación')
  const progress = document.createElement('span')
  progress.className = 'scene-progress'
  let current = 0
  let transitioning = false
  let transitionFallback

  const update = () => {
    track.style.transform = `translateX(-${current * 100}%)`
    previous.hidden = current === 0
    next.hidden = current === scenes.length - 1
    progress.textContent = `${current + 1} / ${scenes.length}`
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
  navigation.append(previous, progress, next)
  main.append(navigation)
  update()
  return main
}
