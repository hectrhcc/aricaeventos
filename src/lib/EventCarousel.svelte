<script>
  /**
   * EventCarousel.svelte
   * Carrusel automático de tarjetas de eventos — rota cada 3.5 s.
   * Recibe el array de eventos filtrados y muestra las tarjetas
   * en una fila horizontal deslizante con dots de navegación.
   */
  import EventCard from './EventCard.svelte';

  /** @type {Array} eventos filtrados a mostrar */
  let { eventos = [] } = $props();

  import { untrack } from 'svelte';

  let currentIndex  = $state(0);
  let isPaused      = $state(false);
  let intervalId    = null;
  let cardsVisible  = $state(1); // se actualiza vía ResizeObserver

  const total = $derived(eventos.length);
  const maxIndex = $derived(Math.max(0, total - cardsVisible));

  // ─── ResizeObserver para detectar cuántas tarjetas entran ──────
  let viewportEl = $state(null);

  $effect(() => {
    if (!viewportEl) return;
    const ro = new ResizeObserver(() => {
      const w = viewportEl.offsetWidth;
      // ~320 px por tarjeta (incluye gap) → calculamos cuántas entran
      cardsVisible = Math.max(1, Math.floor(w / 320));
    });
    ro.observe(viewportEl);
    return () => ro.disconnect();
  });

  // ─── Auto-rotación ─────────────────────────────────────────────
  function start() {
    stop();
    if (total <= cardsVisible) return;
    intervalId = setInterval(() => {
      if (!isPaused) {
        currentIndex = (currentIndex + 1) % (maxIndex + 1);
      }
    }, 3500);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // Reinicia al cambiar los eventos o el viewport
  // Usamos untrack para evitar que la escritura de currentIndex dispare el efecto en cadena
  $effect(() => {
    total;        // ← dependencia reactiva: cambios en eventos
    cardsVisible; // ← dependencia reactiva: cambios en el viewport
    untrack(() => {
      currentIndex = 0;
      start();
    });
    return () => untrack(() => stop());
  });

  // Ajusta maxIndex cuando cambia cardsVisible
  $effect(() => {
    if (currentIndex > maxIndex) currentIndex = maxIndex;
  });

  function goTo(idx) {
    currentIndex = Math.min(idx, maxIndex);
  }

  function prev() {
    currentIndex = Math.max(0, currentIndex - 1);
  }

  function next() {
    currentIndex = Math.min(maxIndex, currentIndex + 1);
  }
</script>

{#if eventos.length > 0}
  <div
    class="carousel-section"
    role="region"
    aria-label="Carrusel de eventos destacados"
    onmouseenter={() => { isPaused = true; }}
    onmouseleave={() => { isPaused = false; }}
    onfocusin={() => { isPaused = true; }}
    onfocusout={() => { isPaused = false; }}
  >
    <h2 class="carousel-heading">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="18" height="18">
        <path d="M12.75 4a.75.75 0 0 0-.75.75v7.5a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75ZM8.25 6a.75.75 0 0 0-.75.75v5.5a.75.75 0 0 0 1.5 0v-5.5A.75.75 0 0 0 8.25 6ZM4.25 8.5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75Z" />
      </svg>
      Eventos en Arica
    </h2>

    <div class="carousel-wrapper">
      <!-- Botón anterior -->
      <button
        class="carousel-btn carousel-btn--prev"
        onclick={prev}
        disabled={currentIndex === 0}
        aria-label="Anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- Viewport con las tarjetas -->
      <div class="carousel-viewport" bind:this={viewportEl}>
        <div
          class="carousel-track"
          style="transform: translateX(-{currentIndex * (100 / cardsVisible)}%);"
        >
          {#each eventos as evento (evento.id)}
            <div class="carousel-slide" style="flex: 0 0 {100 / cardsVisible}%">
              <EventCard {evento} />
            </div>
          {/each}
        </div>
      </div>

      <!-- Botón siguiente -->
      <button
        class="carousel-btn carousel-btn--next"
        onclick={next}
        disabled={currentIndex >= maxIndex}
        aria-label="Siguiente"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- Dots de navegación -->
    {#if maxIndex > 0}
      <div class="carousel-dots" role="tablist" aria-label="Navegación de slides">
        {#each { length: maxIndex + 1 } as _, i}
          <button
            class="carousel-dot"
            class:active={i === currentIndex}
            onclick={() => goTo(i)}
            role="tab"
            aria-selected={i === currentIndex}
            aria-label="Ir al slide {i + 1}"
          >
            {#if i === currentIndex}
              <span class="dot-fill"></span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Indicador de pausa (solo visible al hacer hover) -->
    {#if isPaused}
      <p class="carousel-paused" aria-live="polite">⏸ Pausado</p>
    {/if}
  </div>
{/if}

<style>
  /* ── Contenedor principal ────────────────────── */
  .carousel-section {
    margin-bottom: 2.5rem;
    position: relative;
  }

  .carousel-heading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted, #9d8f7a);
    margin-bottom: 1rem;
  }

  .carousel-heading svg {
    color: var(--color-accent, #c8b39a);
  }

  /* ── Wrapper con botones ─────────────────────── */
  .carousel-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* ── Botones de navegación ───────────────────── */
  .carousel-btn {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: 1px solid var(--color-border, #d4c5aa);
    background-color: var(--color-bg-card, #ece3d3);
    color: var(--color-text-secondary, #6b5f4d);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s, color 0.2s, border-color 0.2s, opacity 0.2s;
    opacity: 0.9;
  }

  .carousel-btn svg {
    width: 1.2rem;
    height: 1.2rem;
  }

  .carousel-btn:hover:not(:disabled) {
    background-color: var(--color-accent, #c8b39a);
    color: #f7f1e8;
    border-color: var(--color-accent, #c8b39a);
    opacity: 1;
  }

  .carousel-btn:disabled {
    opacity: 0.25;
    cursor: default;
  }

  .carousel-btn:focus-visible {
    outline: 2px solid var(--color-accent, #c8b39a);
    outline-offset: 2px;
  }

  /* ── Viewport ────────────────────────────────── */
  .carousel-viewport {
    flex: 1;
    overflow: hidden;
    border-radius: var(--radius-card, 0.875rem);
  }

  /* ── Track deslizante ────────────────────────── */
  .carousel-track {
    display: flex;
    transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    will-change: transform;
  }

  /* ── Cada slide ───────────────────────────────── */
  .carousel-slide {
    padding: 0 0.4rem;
    min-width: 0;
  }

  .carousel-slide:first-child {
    padding-left: 0;
  }

  .carousel-slide:last-child {
    padding-right: 0;
  }

  /* ── Dots ─────────────────────────────────────── */
  .carousel-dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .carousel-dot {
    position: relative;
    width: 2rem;
    height: 0.35rem;
    border-radius: 9999px;
    border: none;
    background-color: var(--color-border, #d4c5aa);
    cursor: pointer;
    padding: 0;
    transition: background-color 0.25s, width 0.25s;
    overflow: hidden;
  }

  .carousel-dot.active {
    background-color: var(--color-accent, #c8b39a);
    width: 2.75rem;
  }

  .carousel-dot .dot-fill {
    position: absolute;
    inset: 0;
    border-radius: 9999px;
  }

  .carousel-dot:hover {
    background-color: var(--color-accent-hover, #bfa88c);
  }

  .carousel-dot:focus-visible {
    outline: 2px solid var(--color-accent, #c8b39a);
    outline-offset: 2px;
  }

  /* ── Indicador de pausa ───────────────────────── */
  .carousel-paused {
    text-align: center;
    font-size: 0.7rem;
    color: var(--color-text-muted, #9d8f7a);
    margin-top: 0.35rem;
    font-weight: 500;
    animation: fade-in 0.2s ease;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── Responsive ───────────────────────────────── */
  @media (max-width: 639px) {
    .carousel-btn {
      display: none; /* mejor UX táctil sin botones pequeños */
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .carousel-track {
      transition: none;
    }
  }
</style>
