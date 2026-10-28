export function homePage() {
  const main = document.createElement('main')
  main.className = 'min-h-screen bg-ink text-white grid place-items-center p-6'
  main.innerHTML = `
    <section class="w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
      <div class="grid lg:grid-cols-[1.2fr_.8fr]">
        <div class="p-8 sm:p-12 lg:p-16 animate-rise">
          <span class="eyebrow">Invita · Recibe · Celebra</span>
          <h1 class="mt-6 max-w-3xl text-5xl font-semibold tracking-[-.05em] sm:text-7xl">Tu evento comienza antes de abrir la puerta.</h1>
          <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Invitaciones digitales con personalidad, accesos QR de un solo uso y una recepción sin listas de papel.</p>
          <div class="mt-10 flex flex-wrap gap-3"><a class="button-primary" href="/login" data-link>Ingresar</a><a class="button-secondary" href="#como-funciona">Cómo funciona</a></div>
        </div>
        <div class="hero-orbit min-h-80" aria-hidden="true"><div class="ticket-mark">Q</div></div>
      </div>
    </section>`
  return main
}

