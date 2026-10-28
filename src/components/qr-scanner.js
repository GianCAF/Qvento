import { Html5Qrcode } from 'html5-qrcode'

export class QrScanner {
  constructor(elementId, onResult) { this.elementId = elementId; this.onResult = onResult; this.instance = new Html5Qrcode(elementId); this.locked = false }
  async start() {
    this.locked = false
    await this.instance.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, async (text) => {
      if (this.locked) return
      this.locked = true; this.instance.pause(true); await this.onResult(text)
    }, () => {})
  }
  resume() { this.locked = false; if (this.instance?.getState() === 3) this.instance.resume() }
  async stop() { if (this.instance?.isScanning) await this.instance.stop(); this.instance?.clear() }
}

