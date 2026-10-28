export function errorPage(title = 'No encontramos esta página', detail = 'Verifica la dirección o vuelve al inicio.') {
  const main = document.createElement('main')
  main.className = 'min-h-screen grid place-items-center bg-ink p-6 text-white text-center'
  const box = document.createElement('div')
  const heading = document.createElement('h1'); heading.className = 'text-4xl font-bold'; heading.textContent = title
  const copy = document.createElement('p'); copy.className = 'mt-4 text-slate-300'; copy.textContent = detail
  const link = document.createElement('a'); link.className = 'button-primary mt-8'; link.href = '/'; link.dataset.link = ''; link.textContent = 'Volver al inicio'
  box.append(heading, copy, link); main.append(box); return main
}

