import { DEFAULT_THEME } from '../config.js'
import { isHexColor } from './validators.js'

const PROPERTY_MAP = {
  primary_color: '--qv-primary', secondary_color: '--qv-secondary', background_color: '--qv-background',
  text_color: '--qv-text', title_color: '--qv-title', button_color: '--qv-button',
  qr_background_color: '--qv-qr-background', qr_card_color: '--qv-qr-card',
}

export function sanitizeTheme(theme = {}) {
  return Object.fromEntries(Object.keys(PROPERTY_MAP).map((key) => [key, isHexColor(theme[key]) ? theme[key].toUpperCase() : DEFAULT_THEME[key]]))
}

export function applyTheme(element, theme) {
  const safe = sanitizeTheme(theme)
  Object.entries(PROPERTY_MAP).forEach(([key, property]) => element.style.setProperty(property, safe[key]))
  return safe
}

