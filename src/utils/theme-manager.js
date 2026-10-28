import { ANIMATED_BACKGROUND_PRESETS, BACKGROUND_PRESETS, DEFAULT_THEME } from '../config.js'
import { isHexColor } from './validators.js'

const PROPERTY_MAP = {
  primary_color: '--qv-primary', secondary_color: '--qv-secondary', background_color: '--qv-background',
  text_color: '--qv-text', title_color: '--qv-title', button_color: '--qv-button',
  qr_background_color: '--qv-qr-background', qr_card_color: '--qv-qr-card',
}

const BACKGROUND_COLOR_KEYS = ['background_color_1', 'background_color_2', 'background_color_3']
const ANIMATION_COLOR_KEYS = ['animation_background_color', 'animation_color_1', 'animation_color_2']
const BACKGROUND_STYLES = new Set(BACKGROUND_PRESETS.map(({ value }) => value))
const ANIMATION_STYLES = new Set(ANIMATED_BACKGROUND_PRESETS.map(({ value }) => value))

function colorStrength(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((channel) => Number.parseInt(channel, 16))
  const chroma = Math.max(...channels) - Math.min(...channels)
  const brightness = channels.reduce((total, channel) => total + channel, 0) / channels.length
  return (chroma * 3) + ((255 - brightness) * .18)
}

function pickStrongestColor(colors) {
  return colors.reduce((strongest, color) => colorStrength(color) > colorStrength(strongest) ? color : strongest)
}

export function pickStrongestBackgroundColor(theme) {
  const safe = BACKGROUND_COLOR_KEYS.map((key) => isHexColor(theme[key]) ? theme[key].toUpperCase() : DEFAULT_THEME[key])
  return pickStrongestColor(safe)
}

export function buildBackgroundDesign(theme) {
  const c1 = theme.background_color_1
  const c2 = theme.background_color_2
  const c3 = theme.background_color_3
  const designs = {
    solid: 'none',
    watercolor: `radial-gradient(ellipse at 18% 24%, color-mix(in srgb, ${c2} 58%, transparent) 0 12%, transparent 42%), radial-gradient(ellipse at 78% 18%, color-mix(in srgb, ${c1} 72%, transparent) 0 15%, transparent 46%), radial-gradient(ellipse at 55% 78%, color-mix(in srgb, ${c2} 48%, transparent) 0 18%, transparent 52%), linear-gradient(135deg, color-mix(in srgb, ${c1} 82%, #fff), color-mix(in srgb, ${c2} 25%, #fff))`,
    aurora: `radial-gradient(ellipse at 12% 30%, color-mix(in srgb, ${c1} 78%, transparent), transparent 48%), radial-gradient(ellipse at 82% 22%, color-mix(in srgb, ${c2} 70%, transparent), transparent 46%), radial-gradient(ellipse at 55% 88%, color-mix(in srgb, ${c3} 64%, transparent), transparent 52%), linear-gradient(145deg, color-mix(in srgb, ${c1} 22%, #fff), color-mix(in srgb, ${c3} 25%, #fff))`,
    mesh: `radial-gradient(circle at 8% 8%, ${c1}, transparent 34%), radial-gradient(circle at 92% 12%, ${c2}, transparent 38%), radial-gradient(circle at 72% 92%, ${c3}, transparent 42%), radial-gradient(circle at 18% 82%, color-mix(in srgb, ${c2} 55%, ${c1}), transparent 40%), linear-gradient(135deg, color-mix(in srgb, ${c1} 18%, #fff), color-mix(in srgb, ${c3} 20%, #fff))`,
    sunset: `linear-gradient(155deg, color-mix(in srgb, ${c1} 70%, #fff) 0%, ${c2} 48%, color-mix(in srgb, ${c3} 82%, #fff) 100%)`,
    clouds: `radial-gradient(ellipse at 16% 30%, color-mix(in srgb, ${c2} 52%, transparent) 0 16%, transparent 48%), radial-gradient(ellipse at 70% 18%, color-mix(in srgb, ${c1} 65%, transparent) 0 14%, transparent 44%), radial-gradient(ellipse at 62% 82%, color-mix(in srgb, ${c2} 42%, transparent) 0 20%, transparent 54%), linear-gradient(125deg, color-mix(in srgb, ${c1} 32%, #fff), color-mix(in srgb, ${c2} 20%, #fff))`,
    radial: `radial-gradient(circle at center, color-mix(in srgb, ${c1} 30%, #fff) 0 18%, color-mix(in srgb, ${c2} 62%, #fff) 58%, ${c2} 100%)`,
    diagonal: `repeating-linear-gradient(135deg, color-mix(in srgb, ${c1} 34%, #fff) 0 13%, color-mix(in srgb, ${c2} 32%, #fff) 13% 26%, color-mix(in srgb, ${c1} 18%, #fff) 26% 39%)`,
    waves: `radial-gradient(ellipse at 10% 110%, transparent 0 38%, color-mix(in srgb, ${c1} 62%, transparent) 39% 49%, transparent 50%), radial-gradient(ellipse at 70% 110%, transparent 0 40%, color-mix(in srgb, ${c2} 58%, transparent) 41% 52%, transparent 53%), linear-gradient(145deg, color-mix(in srgb, ${c3} 28%, #fff), color-mix(in srgb, ${c1} 18%, #fff))`,
    spotlight: `radial-gradient(circle at 50% 42%, color-mix(in srgb, ${c2} 18%, #fff) 0 12%, color-mix(in srgb, ${c1} 48%, transparent) 48%, color-mix(in srgb, ${c2} 35%, #fff) 100%)`,
    nebula: `radial-gradient(ellipse at 25% 28%, color-mix(in srgb, ${c1} 82%, transparent), transparent 38%), radial-gradient(ellipse at 76% 38%, color-mix(in srgb, ${c2} 76%, transparent), transparent 42%), radial-gradient(ellipse at 48% 86%, color-mix(in srgb, ${c3} 72%, transparent), transparent 45%), linear-gradient(135deg, color-mix(in srgb, ${c1} 35%, #111827), color-mix(in srgb, ${c3} 32%, #111827))`,
  }
  return designs[theme.background_style] ?? designs.watercolor
}

export function sanitizeTheme(theme = {}) {
  const safe = Object.fromEntries(Object.keys(PROPERTY_MAP).map((key) => [key, isHexColor(theme[key]) ? theme[key].toUpperCase() : DEFAULT_THEME[key]]))
  safe.background_style = BACKGROUND_STYLES.has(theme.background_style) ? theme.background_style : DEFAULT_THEME.background_style
  BACKGROUND_COLOR_KEYS.forEach((key, index) => {
    const legacyFallback = index === 0 ? theme.background_color : null
    safe[key] = isHexColor(theme[key])
      ? theme[key].toUpperCase()
      : isHexColor(legacyFallback) ? legacyFallback.toUpperCase() : DEFAULT_THEME[key]
  })
  safe.background_color = safe.background_color_1
  safe.animation_style = ANIMATION_STYLES.has(theme.animation_style) ? theme.animation_style : DEFAULT_THEME.animation_style
  ANIMATION_COLOR_KEYS.forEach((key) => {
    safe[key] = isHexColor(theme[key]) ? theme[key].toUpperCase() : DEFAULT_THEME[key]
  })
  return safe
}

export function applyTheme(element, theme) {
  const safe = sanitizeTheme(theme)
  Object.entries(PROPERTY_MAP).forEach(([key, property]) => element.style.setProperty(property, safe[key]))
  element.style.setProperty('--qv-background-design', buildBackgroundDesign(safe))
  const accentColor = safe.animation_style === 'none'
    ? pickStrongestBackgroundColor(safe)
    : pickStrongestColor([safe.animation_background_color, safe.animation_color_1, safe.animation_color_2])
  element.style.setProperty('--qv-background-accent', accentColor)
  element.style.setProperty('--qv-animation-background', safe.animation_background_color)
  element.style.setProperty('--qv-animation-color-1', safe.animation_color_1)
  element.style.setProperty('--qv-animation-color-2', safe.animation_color_2)
  element.classList.toggle('has-animated-background', safe.animation_style !== 'none')
  element.dataset.animationStyle = safe.animation_style
  return safe
}

