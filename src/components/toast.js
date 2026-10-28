export function showToast(message, type = 'info') {
  let region = document.querySelector('#toast-region')
  if (!region) {
    region = document.createElement('div')
    region.id = 'toast-region'
    region.className = 'fixed right-4 top-4 z-[100] grid gap-2'
    region.setAttribute('aria-live', 'assertive')
    document.body.append(region)
  }
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  region.append(toast)
  window.setTimeout(() => toast.remove(), 4500)
}

