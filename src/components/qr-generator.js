import QRCode from 'qrcode'

export async function renderQr(canvas, value) {
  await QRCode.toCanvas(canvas, value, { width: 280, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#111827', light: '#FFFFFF' } })
}

export function downloadQr(canvas, filename = 'qvento-qr.png') {
  const link = document.createElement('a'); link.download = filename; link.href = canvas.toDataURL('image/png'); link.click()
}

