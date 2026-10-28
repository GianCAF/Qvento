export const DEFAULT_INVITATION_MESSAGE = '¡Hola! Soy {celebrant_name} y me gustaría invitarte a mi fiesta de {event_name}, el día {event_date} en {event_address}. ¡Ahí te espero!'

export const DEFAULT_THEME = Object.freeze({
  primary_color: '#D946EF', secondary_color: '#F9A8D4', background_color: '#FFF1F2',
  background_style: 'watercolor', background_color_1: '#FFF1F2',
  background_color_2: '#F9A8D4', background_color_3: '#D946EF',
  animation_style: 'none', animation_background_color: '#FFF1F2',
  animation_color_1: '#D946EF', animation_color_2: '#F9A8D4',
  text_color: '#1F2937', title_color: '#701A75', button_color: '#BE185D',
  qr_background_color: '#FFF1F2', qr_card_color: '#FFFFFF',
})

export const THEME_FIELDS = [
  ['primary_color', 'Color principal'], ['secondary_color', 'Color secundario'],
  ['text_color', 'Texto'], ['title_color', 'Títulos'],
  ['button_color', 'Botones'], ['qr_background_color', 'Fondo QR'], ['qr_card_color', 'Tarjeta QR'],
]

export const BACKGROUND_PRESETS = Object.freeze([
  { value: 'solid', label: 'Color neutro', colors: 1 },
  { value: 'watercolor', label: 'Acuarela suave', colors: 2 },
  { value: 'aurora', label: 'Aurora', colors: 3 },
  { value: 'mesh', label: 'Malla luminosa', colors: 3 },
  { value: 'sunset', label: 'Atardecer', colors: 3 },
  { value: 'clouds', label: 'Nubes suaves', colors: 2 },
  { value: 'radial', label: 'Resplandor radial', colors: 2 },
  { value: 'diagonal', label: 'Diagonal elegante', colors: 2 },
  { value: 'waves', label: 'Ondas', colors: 3 },
  { value: 'spotlight', label: 'Foco central', colors: 2 },
  { value: 'nebula', label: 'Nebulosa', colors: 3 },
])

export const ANIMATED_BACKGROUND_PRESETS = Object.freeze([
  { value: 'none', label: 'Sin animación', colors: 0 },
  { value: 'fireworks', label: 'Fuegos artificiales', colors: 2 },
  { value: 'petals', label: 'Lluvia de pétalos', colors: 1 },
  { value: 'stars', label: 'Lluvia de estrellas', colors: 1 },
  { value: 'bloom', label: 'Flores creciendo', colors: 1 },
])

