<script>
  /**
   * App.svelte — Eventos Arica
   * Componente raíz de la SPA.
   * Carga eventos.json, aplica filtros reactivos y renderiza la UI.
   */
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import EventCard      from './lib/EventCard.svelte';
  import EventCarousel  from './lib/EventCarousel.svelte';
  import FilterPills    from './lib/FilterPills.svelte';
  import ImageModal     from './lib/ImageModal.svelte';
  import SearchBar      from './lib/SearchBar.svelte';
  import { filtrarPorFecha } from './lib/utils.js';

  // ─── Estado ──────────────────────────────────────────────────────────────────
  let todos      = $state([]);   // todos los eventos sin filtrar
  let cargando   = $state(true);
  let error      = $state(null);

  // Filtros controlados por el usuario
  let busqueda   = $state('');
  let filtroCat  = $state('todos');
  let filtroFec  = $state('todos');

  // ─── Opciones de filtro ──────────────────────────────────────────────────────
  const opsCat = [
    { label: '✦ Todos',     value: 'todos'    },
    { label: '🎉 Fiestas',  value: 'Fiestas'  },
    { label: '🎵 En vivo',  value: 'En vivo'  },
    { label: '🏃 Deportes', value: 'Deportes' },
    { label: '🎨 Cultura',  value: 'Cultura'  },
  ];

  const opsFec = [
    { label: '📅 Todos',      value: 'todos' },
    { label: '⚡ Hoy',        value: 'hoy'   },
    { label: '🌅 Este finde', value: 'finde' },
  ];

  // ─── Carga de datos con onMount ───────────────────────────────────────────────
  onMount(async () => {
    try {
      const res = await fetch('/eventos.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Ordenar por fecha ascendente (más próximos primero)
      todos = data.sort((a, b) => a.fecha.localeCompare(b.fecha));
    } catch (e) {
      error = 'No se pudo cargar la lista de eventos. Intenta recargar la página.';
      console.error('[EventosArica] Error al cargar eventos.json:', e);
    } finally {
      cargando = false;
    }
  });

  // ─── Lógica de filtrado reactiva ─────────────────────────────────────────────
  const eventosFiltrados = $derived.by(() => {
    let resultado = todos;

    // 1. Filtro de texto (título, lugar, categoría — case-insensitive)
    const q = busqueda.trim().toLowerCase();
    if (q) {
      resultado = resultado.filter(e =>
        e.titulo.toLowerCase().includes(q)    ||
        e.lugar.toLowerCase().includes(q)     ||
        e.categoria.toLowerCase().includes(q)
      );
    }

    // 2. Filtro de categoría
    if (filtroCat !== 'todos') {
      resultado = resultado.filter(e => e.categoria === filtroCat);
    }

    // 3. Filtro de fecha
    resultado = filtrarPorFecha(resultado, filtroFec);

    return resultado;
  });

  // Contador reactivo de resultados
  const conteo = $derived(eventosFiltrados.length);

  // ─── Modal de imagen ───────────────────────────────────────────────────────
  let modalSrc  = $state('');
  let modalAlt  = $state('');
  let modalOpen = $state(false);

  function abrirModal(src, alt) {
    modalSrc  = src;
    modalAlt  = alt;
    modalOpen = true;
  }

  function cerrarModal() {
    modalOpen = false;
  }
</script>

<!-- ─── HTML ──────────────────────────────────────────────────────────────────── -->
<div class="app-shell">

  <!-- Skip link — permite saltar el hero al contenido principal -->
  <a href="#main-content" class="skip-link">
    Ir al contenido
  </a>

  <!-- ══ HERO / HEADER ══════════════════════════════════════════════════════════ -->
  <header class="hero">
    <!-- Orbe decorativo de fondo -->
    <div class="hero-orb" aria-hidden="true"></div>

    <div class="hero-content">
      <!-- Logo / eyebrow -->
      <p class="hero-eyebrow hero-animate" style="--delay: 0ms">
        <span class="dot"></span>
        Arica, Chile
      </p>

      <!-- Título principal H1 -->
      <h1 class="hero-title hero-animate" style="--delay: 150ms">
        ¿Qué hacer<br />
        en <span class="hero-title-accent">Arica</span>?
      </h1>

      <p class="hero-sub hero-animate" style="--delay: 300ms">
        Descubre fiestas, conciertos, deportes y cultura.
      </p>
    </div>

    <!-- Ola decorativa inferior -->
    <div class="hero-wave" aria-hidden="true">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="var(--color-bg-base)"/>
      </svg>
    </div>
  </header>

  <!-- ══ CONTENIDO PRINCIPAL ═══════════════════════════════════════════════════ -->
  <main id="main-content" class="main-content">

    <!-- ── Carrusel de eventos en Arica ── -->
    <EventCarousel eventos={eventosFiltrados} />

    <!-- ── Barra de búsqueda y filtros ── -->
    <section class="section-filters" aria-label="Filtros de búsqueda">
      <div class="filter-animate" style="--delay: 0ms">
        <SearchBar bind:valor={busqueda} placeholder="Buscar por título, lugar o categoría…" />
      </div>

      <!-- Filtros de categoría -->
      <div class="filter-group filter-animate" style="--delay: 100ms">
        <p class="filter-label" id="label-categoria">Categoría</p>
        <FilterPills opciones={opsCat} bind:valor={filtroCat} labelId="label-categoria" />
      </div>

      <!-- Filtros de fecha -->
      <div class="filter-group filter-animate" style="--delay: 200ms">
        <p class="filter-label" id="label-cuando">Cuándo</p>
        <FilterPills opciones={opsFec} bind:valor={filtroFec} labelId="label-cuando" />
      </div>
    </section>

    <!-- ── Resultados ── -->
    <section class="section-results" aria-label="Lista de eventos">

      <!-- Estado: Cargando -->
      {#if cargando}
        <div class="state-container" aria-live="polite" aria-label="Cargando eventos">
          <div class="spinner" role="status">
            <span class="sr-only">Cargando…</span>
          </div>
          <p class="state-text">Buscando eventos en Arica…</p>
        </div>

      <!-- Estado: Error -->
      {:else if error}
        <div class="state-container">
          <span class="state-emoji" aria-hidden="true">⚠️</span>
          <p class="state-text">{error}</p>
          <button class="btn-retry" onclick={() => window.location.reload()}>Reintentar</button>
        </div>

      <!-- Estado: Sin resultados -->
      {:else if conteo === 0}
        <div class="state-container" aria-live="polite">
          <span class="state-emoji" aria-hidden="true">🔍</span>
          <p class="state-title">Sin resultados</p>
          <p class="state-text">No hay eventos para estos filtros, ¡intenta con otra fecha!</p>
          <button
            class="btn-retry"
            onclick={() => { busqueda = ''; filtroCat = 'todos'; filtroFec = 'todos'; }}
          >
            Limpiar filtros
          </button>
        </div>

      <!-- Estado: Resultados ✓ -->
      {:else}
        <!-- Contador de resultados -->
        {#key conteo}
          <p class="results-count" aria-live="polite" in:fly={{ y: 16, duration: 400, opacity: 0 }}>
            {conteo} {conteo === 1 ? 'evento encontrado' : 'eventos encontrados'}
          </p>
        {/key}

        <!-- Grilla de tarjetas -->
        <div class="events-grid" role="list">
          {#each eventosFiltrados as evento, i (evento.id)}
            <div
              role="listitem"
              in:fly={{ y: 24, duration: 450, delay: i * 80, opacity: 0 }}
              out:fly={{ y: -16, duration: 250, opacity: 0 }}
            >
              <EventCard {evento} onImageClick={(src, alt) => abrirModal(src, alt)} />
            </div>
          {/each}
        </div>
      {/if}

    </section>
  </main>

  <!-- ══ MODAL DE IMAGEN ════════════════════════════════════════════════════ -->
  {#if modalOpen}
    <ImageModal src={modalSrc} alt={modalAlt} onclose={cerrarModal} />
  {/if}

  <!-- ══ FOOTER ═════════════════════════════════════════════════════════════════ -->
  <footer class="site-footer">
    <p>Hecho con <span aria-label="amor">💪</span> en Arica · <strong>Eventos Arica</strong> {new Date().getFullYear()}</p>
  </footer>

</div>

<style>
  /* ── Shell ──────────────────────────────────────── */
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ── HERO ────────────────────────────────────────── */
  .hero {
    position: relative;
    overflow: hidden;
    padding: 4rem 1.25rem 5rem;
    background: linear-gradient(160deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%),
                url('/aricaeventos.png')
                center top / cover no-repeat;
    text-align: center;
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 767px) {
    .hero {
      background-position: 70% top;
    }
  }

  /* Overlay sutil extra para profundidad */
  .hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%);
    pointer-events: none;
    z-index: 0;
  }

  /* Orbe decorativo — más sutil para no competir con la imagen */
  .hero-orb {
    position: absolute;
    top: -6rem;
    left: 50%;
    transform: translateX(-50%);
    width: 28rem;
    height: 28rem;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    max-width: 38rem;
    margin: 0 auto;
    padding: 1rem 0;
  }

  .dot {
    display: inline-block;
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 50%;
    background-color: var(--color-cat-deportes, #4e9a80);
    animation: pulse-dot 2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.8); }
  }

  .hero-title {
    font-size: clamp(2.2rem, 10vw, 3.75rem);
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: #ffffff;
    margin-bottom: 1rem;
    text-shadow: 0 2px 20px rgba(0,0,0,0.3);
  }

  .hero-title-accent {
    background: linear-gradient(135deg, #f0dcc5 0%, #d4b896 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-sub {
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.65;
    text-shadow: 0 1px 12px rgba(0,0,0,0.25);
  }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 1rem;
  }

  /* ── Animación de entrada del hero ────────────── */
  .hero-animate {
    opacity: 0;
    animation: hero-enter 0.5s ease-out var(--delay, 0ms) forwards;
  }

  @keyframes hero-enter {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Ola inferior */
  .hero-wave {
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 3.75rem;
    pointer-events: none;
  }

  .hero-wave svg {
    width: 100%;
    height: 100%;
  }

  /* ── CONTENIDO PRINCIPAL ─────────────────────────── */
  .main-content {
    flex: 1;
    max-width: 75rem;
    width: 100%;
    margin: 0 auto;
    padding: 1.5rem 1rem 3rem;
  }

  /* ── Sección filtros ─────────────────────────────── */
  .section-filters {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    margin-bottom: 1.75rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .filter-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted, #9d8f7a);
  }

  /* ── Contador ────────────────────────────────────── */
  .results-count {
    font-size: 0.8rem;
    color: var(--color-text-muted, #9d8f7a);
    margin-bottom: 1rem;
    font-weight: 500;
  }

  /* ── Grilla de eventos ───────────────────────────── */
  .events-grid {
    display: grid;
    gap: 1.25rem;
    grid-template-columns: 1fr; /* mobile: 1 col */
  }

  @media (min-width: 540px) {
    .events-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (min-width: 900px) {
    .events-grid { grid-template-columns: repeat(3, 1fr); }
  }

  @media (min-width: 1200px) {
    .events-grid { grid-template-columns: repeat(4, 1fr); }
  }

  /* ── Animaciones de entrada ──────────────────── */
  .filter-animate {
    opacity: 0;
    animation: card-enter 0.45s ease-out var(--delay, 0ms) forwards;
  }

  @keyframes card-enter {
    from {
      opacity: 0;
      transform: translateY(24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-animate,
    .filter-animate {
      animation: none;
      opacity: 1;
    }
  }

  /* ── Estados vacíos / cargando / error ───────────── */
  .state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.85rem;
    padding: 4rem 1.5rem;
    text-align: center;
  }

  .state-emoji {
    font-size: 3rem;
    line-height: 1;
  }

  .state-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text-primary, #2b2418);
  }

  .state-text {
    font-size: 0.9rem;
    color: var(--color-text-secondary, #6b5f4d);
    max-width: 24rem;
    line-height: 1.6;
  }

  .btn-retry {
    margin-top: 0.5rem;
    padding: 0.65rem 1.5rem;
    border-radius: 9999px;
    border: 1px solid var(--color-accent, #c8b39a);
    background: transparent;
    color: var(--color-accent, #c8b39a);
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }

  .btn-retry:hover {
    background-color: var(--color-accent, #c8b39a);
    color: #f7f1e8;
  }

  .btn-retry:focus-visible {
    outline: 2px solid var(--color-accent, #c8b39a);
    outline-offset: 3px;
  }

  /* ── Spinner ─────────────────────────────────────── */
  .spinner {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    border: 3px solid var(--color-border, #d4c5aa);
    border-top-color: var(--color-accent, #c8b39a);
    animation: spin 0.75s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── Footer ──────────────────────────────────────── */
  .site-footer {
    padding: 1.5rem 1rem;
    text-align: center;
    font-size: 0.8rem;
    color: var(--color-text-muted, #9d8f7a);
    border-top: 1px solid var(--color-border, #d4c5aa);
  }

  /* ── Skip link ────────────────────────────────── */
  .skip-link {
    position: absolute;
    top: -100%;
    left: 0;
    z-index: 100;
    padding: 0.75rem 1.5rem;
    background: var(--color-text-primary, #2b2418);
    color: var(--color-bg-base, #f7f1e8);
    font-size: 0.9rem;
    font-weight: 600;
    text-decoration: none;
    border-radius: 0 0 0.5rem 0;
    transition: top 0.15s;
  }

  .skip-link:focus {
    top: 0;
  }

  .skip-link:focus-visible {
    outline: 2px solid var(--color-accent, #c8b39a);
    outline-offset: 2px;
  }

  /* ── Accesibilidad ───────────────────────────────── */
  .sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0,0,0,0);
    white-space: nowrap; border: 0;
  }

</style>
