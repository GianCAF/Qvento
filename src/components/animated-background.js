const PARTICLE_COUNTS = Object.freeze({ fireworks: 3, petals: 16, stars: 20, bloom: 9 })

function createParticle(document, effect, index) {
  const particle = document.createElement('span')
  particle.className = `qv-effect-particle qv-${effect}`
  particle.style.setProperty('--particle-index', index)
  particle.style.setProperty('--particle-x', `${(index * 37) % 97}%`)
  particle.style.setProperty('--particle-delay', `${-((index * 1.17) % 9).toFixed(2)}s`)
  particle.style.setProperty('--particle-duration', `${(6.5 + ((index * 13) % 50) / 10).toFixed(1)}s`)
  particle.style.setProperty('--particle-size', `${8 + ((index * 7) % 11)}px`)
  particle.style.setProperty('--stem-height', `${22 + ((index * 11) % 24)}%`)
  return particle
}

function createFirework(document, index) {
  const firework = createParticle(document, 'fireworks', index)
  firework.style.setProperty('--particle-x', `${20 + (index * 29)}%`)
  firework.style.setProperty('--particle-delay', `${index * 1.8}s`)
  const rocket = document.createElement('span')
  rocket.className = 'qv-firework-rocket'
  const burst = document.createElement('span')
  burst.className = 'qv-firework-burst'
  for (let sparkIndex = 0; sparkIndex < 10; sparkIndex += 1) {
    const spark = document.createElement('i')
    spark.style.setProperty('--spark-angle', `${sparkIndex * 36}deg`)
    burst.append(spark)
  }
  firework.append(rocket, burst)
  return firework
}

export function renderAnimatedBackground(container, effect) {
  container.querySelector(':scope > .qv-effect-layer')?.remove()
  if (!Object.hasOwn(PARTICLE_COUNTS, effect)) return null
  const document = container.ownerDocument
  const layer = document.createElement('div')
  layer.className = 'qv-effect-layer'
  layer.dataset.effect = effect
  layer.setAttribute('aria-hidden', 'true')
  const count = PARTICLE_COUNTS[effect]
  for (let index = 0; index < count; index += 1) {
    layer.append(effect === 'fireworks' ? createFirework(document, index) : createParticle(document, effect, index))
  }
  container.prepend(layer)
  return layer
}
