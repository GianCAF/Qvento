export const DEFAULT_INVITATION_MESSAGE = '¡Hola! Soy {celebrant_name} y me gustaría invitarte a mi fiesta de {event_name}, el día {event_date} en {event_address}. ¡Ahí te espero!'

export const DEFAULT_THEME = Object.freeze({
  primary_color: '#D946EF', secondary_color: '#F9A8D4', background_color: '#FFF1F2',
  text_color: '#1F2937', title_color: '#701A75', button_color: '#BE185D',
  qr_background_color: '#FFF1F2', qr_card_color: '#FFFFFF',
})

export const THEME_FIELDS = [
  ['primary_color', 'Color principal'], ['secondary_color', 'Color secundario'],
  ['background_color', 'Fondo'], ['text_color', 'Texto'], ['title_color', 'Títulos'],
  ['button_color', 'Botones'], ['qr_background_color', 'Fondo QR'], ['qr_card_color', 'Tarjeta QR'],
]

