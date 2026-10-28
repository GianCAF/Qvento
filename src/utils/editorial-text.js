export function renderDropCap(element, text) {
  const value = String(text ?? '')
  const firstLetter = value.match(/\p{L}/u)
  element.replaceChildren()
  if (!firstLetter) {
    element.textContent = value
    return
  }

  const document = element.ownerDocument
  const dropCap = document.createElement('span')
  dropCap.className = 'drop-cap'
  dropCap.setAttribute('aria-hidden', 'true')
  dropCap.textContent = firstLetter[0]
  const accessibleText = document.createElement('span')
  accessibleText.className = 'sr-only'
  accessibleText.textContent = value
  const visualText = document.createElement('span')
  visualText.className = 'visual-copy'
  visualText.setAttribute('aria-hidden', 'true')
  visualText.append(dropCap, value.slice(firstLetter.index + firstLetter[0].length))
  element.append(accessibleText, visualText)
}
