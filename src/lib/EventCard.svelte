<script>
  /**
   * EventCard.svelte
   * Tarjeta individual de evento con imagen, badge de categoría,
   * fecha formateada, precio y botón de compra.
   */
  import { fechaCorta, formatearPrecio, colorCategoria } from './utils.js';

  /** @type {{ titulo: string, productora: string, fecha: string, hora: string,
   *           lugar: string, precio_desde: number, categoria: string,
   *           imagen: string, url_ticket: string }} */
  /** @type {(src: string, alt: string) => void} */
  let { evento, onImageClick } = $props();

  const colores  = $derived(colorCategoria(evento.categoria));
  const fechaFmt = $derived(fechaCorta(evento.fecha, evento.hora));
  const precio   = $derived(formatearPrecio(evento.precio_desde));
  const esGratis = $derived(evento.precio_desde === 0);

  let imgError = $state(false);
  const sinImagen = $derived(!evento.imagen || imgError);
</script>

<!-- Tarjeta principal -->
<article
  class="event-card"
  style="--cat-bg:{colores.bg}; --cat-text:{colores.text}; --cat-border:{colores.border};"
>
  <!-- ── Imagen ── -->
  <div class="card-img-wrap" class:no-image={sinImagen}>
    {#if sinImagen}
      <!-- Placeholder decorativo sin imagen -->
      <div class="img-placeholder" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </div>
    {:else}
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_noninteractive_tabindex -->
      <img
        src={evento.imagen}
        alt={`Imagen de ${evento.titulo}`}
        loading="lazy"
        decoding="async"
        onerror={() => (imgError = true)}
        class:clickable={!!onImageClick}
        role={onImageClick ? 'button' : undefined}
        tabindex={onImageClick ? 0 : undefined}
        onclick={onImageClick ? () => onImageClick(evento.imagen, `Imagen de ${evento.titulo}`) : undefined}
        onkeydown={onImageClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onImageClick(evento.imagen, `Imagen de ${evento.titulo}`); } } : undefined}
      />
    {/if}
    <!-- Badge de categoría sobre la imagen -->
    <span class="cat-badge">{evento.categoria}</span>
    <!-- Precio flotante -->
    <span class="price-badge" class:free={esGratis}>{precio}</span>
  </div>

  <!-- ── Contenido ── -->
  <div class="card-body">
    <!-- Título -->
    <h2 class="card-title">{evento.titulo}</h2>

    <!-- Productora -->
    <p class="card-producer">por {evento.productora}</p>

    <!-- Meta: fecha y lugar -->
    <div class="card-meta">
      <!-- Fecha -->
      <div class="meta-item">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clip-rule="evenodd" />
        </svg>
        <span>{fechaFmt}</span>
      </div>
      <!-- Lugar -->
      <div class="meta-item">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clip-rule="evenodd" />
        </svg>
        <span>{evento.lugar}</span>
      </div>
    </div>

  </div>
</article>

<style>
  /* ── Tarjeta ─────────────────────────────────────── */
  .event-card {
    background-color: var(--color-bg-card, #ece3d3);
    border: 1px solid var(--color-border, #d4c5aa);
    border-radius: var(--radius-card, 1rem);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    cursor: default;
  }

  .event-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--cat-border);
    border-color: var(--cat-border);
  }

  /* ── Imagen ──────────────────────────────────────── */
  .card-img-wrap {
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background-color: #dbceb6;
  }

  .card-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform 0.4s ease;
  }

  .card-img-wrap img.clickable {
    cursor: pointer;
  }

  .card-img-wrap img.clickable:focus-visible {
    outline: 3px solid var(--color-accent, #c8b39a);
    outline-offset: -3px;
  }

  .event-card:hover .card-img-wrap img {
    transform: scale(1.04);
  }

  /* ── Placeholder sin imagen ──────────────────── */
  .img-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(145deg, #e4d9c5 0%, #dbceb6 100%);
    transition: transform 0.4s ease;
  }

  .img-placeholder svg {
    width: 4rem;
    height: 4rem;
    color: #c8b39a;
    opacity: 0.6;
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .event-card:hover .img-placeholder svg {
    opacity: 0.9;
    transform: scale(1.1);
  }

  .event-card:hover .img-placeholder {
    transform: scale(1.04);
  }

  /* Overlay degradado */
  .card-img-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(236,227,211,0.9) 0%, transparent 60%);
    pointer-events: none;
  }

  /* Overlay más sutil cuando no hay imagen real */
  .card-img-wrap.no-image::after {
    background: linear-gradient(to top, rgba(236,227,211,0.75) 0%, transparent 45%);
  }

  /* ── Badges flotantes ──────────────────────────── */
  .cat-badge {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    z-index: 2;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background-color: var(--cat-bg);
    color: var(--cat-text);
    border: 1px solid var(--cat-border);
    backdrop-filter: blur(8px);
  }

  .price-badge {
    position: absolute;
    bottom: 0.75rem;
    right: 0.75rem;
    z-index: 2;
    padding: 0.3rem 0.8rem;
    border-radius: 9999px;
    font-size: 0.78rem;
    font-weight: 700;
    background-color: rgba(236, 227, 211, 0.85);
    color: var(--color-text-secondary, #6b5f4d);
    border: 1px solid var(--color-border, #d4c5aa);
    backdrop-filter: blur(8px);
  }

  .price-badge.free {
    color: #10b981;
    border-color: #10b98144;
  }

  /* ── Cuerpo ──────────────────────────────────────── */
  .card-body {
    padding: 1.1rem 1.25rem 1.35rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  .card-title {
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--color-text-primary, #2b2418);
    letter-spacing: -0.01em;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-producer {
    font-size: 0.75rem;
    color: var(--color-text-muted, #9d8f7a);
    font-weight: 500;
  }

  /* ── Meta info ───────────────────────────────────── */
  .card-meta {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-top: 0.15rem;
  }

  .meta-item {
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
    font-size: 0.8rem;
    color: var(--color-text-secondary, #6b5f4d);
    line-height: 1.4;
  }

  .meta-item svg {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    margin-top: 0.05rem;
    color: var(--cat-text);
    opacity: 0.8;
  }
</style>
