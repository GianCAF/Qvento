export function createModal({ title, content, confirmLabel = 'Confirmar', onConfirm, dialogClass = '' }) {
  const dialog = document.createElement('dialog')
  dialog.className = `modal-card ${dialogClass}`.trim()
  const heading = document.createElement('h2')
  heading.className = 'text-xl font-bold'
  heading.textContent = title
  const body = document.createElement('div')
  body.className = 'my-5'
  body.append(content)
  const actions = document.createElement('div')
  actions.className = 'flex justify-end gap-3'
  const cancel = Object.assign(document.createElement('button'), { textContent: 'Cancelar', className: 'button-secondary' })
  const confirm = Object.assign(document.createElement('button'), { textContent: confirmLabel, className: 'button-primary' })
  cancel.addEventListener('click', () => dialog.close())
  confirm.addEventListener('click', async () => { await onConfirm?.(); dialog.close() })
  actions.append(cancel, confirm)
  dialog.append(heading, body, actions)
  dialog.addEventListener('close', () => dialog.remove())
  document.body.append(dialog)
  dialog.showModal()
  return dialog
}

