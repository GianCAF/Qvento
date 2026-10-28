import './styles/main.css'
import './styles/animations.css'

const app = document.querySelector('#app')

app.innerHTML = `
  <main class="min-h-screen bg-ink text-white grid place-items-center p-6">
    <section class="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
      <div class="grid lg:grid-cols-[1.2fr_.8fr]">
        <div class="p-8 sm:p-12 lg:p-16">
          <span class="eyebrow">Invita · Recibe · Celebra</span>
          <h1 class="mt-6 max-w-3xl text-5xl font-semibold tracking-[-.05em] sm:text-7xl">Tu evento comienza antes de abrir la puerta.</h1>
          <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Qvento reúne invitaciones digitales personalizadas, accesos QR de un solo uso y asistencia en tiempo real.</p>
          <a class="button-primary mt-10 inline-flex" href="/login" data-link>Ingresar a Qvento</a>
        </div>
        <div class="hero-orbit min-h-80" aria-hidden="true"><div class="ticket-mark">Q</div></div>
      </div>
    </section>
  </main>`

