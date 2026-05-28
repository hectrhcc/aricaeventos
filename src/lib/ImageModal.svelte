<script>
  /**
   * ImageModal.svelte
   * Modal a pantalla completa que muestra una imagen en sus dimensiones reales.
   * Se cierra al hacer clic en el backdrop, en el botón cerrar, o presionando Escape.
   */
  import { onMount, onDestroy } from 'svelte';

  let { src = '', alt = '', onclose = () => {} } = $props();

  let open      = $state(false);
  let closeTimer = null;

  onMount(() => {
    // Pequeño delay para animación de entrada
    requestAnimationFrame(() => { open = true; });
  });

  onDestroy(() => {
    if (closeTimer) clearTimeout(closeTimer);
  });

  function close() {
    open = false;
    // Dar tiempo a la animación de salida
    closeTimer = setTimeout(() => onclose(), 200);
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') close();
  }
</script>



<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
  class="modal-backdrop"
  class:open
  onclick={close}
  role="dialog"
  aria-modal="true"
  aria-label="Vista ampliada de imagen"
  tabindex="-1"
>
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="modal-content"
    onclick={(e) => e.stopPropagation()}
    role="document"
  >
    <button class="modal-close" onclick={close} aria-label="Cerrar">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="24" height="24">
        <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4Z" />
      </svg>
    </button>

    {#if src}
      <img
        src={src}
        {alt}
        class="modal-img"
        loading="eager"
        decoding="async"
      />
    {/if}
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(6px);
    padding: 1.5rem;
    opacity: 0;
    transition: opacity 0.25s ease;
    cursor: zoom-out;
  }

  .modal-backdrop.open {
    opacity: 1;
  }

  .modal-content {
    position: relative;
    max-width: 95vw;
    max-height: 95vh;
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    cursor: default;
    transform: scale(0.92);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .modal-backdrop.open .modal-content {
    transform: scale(1);
  }

  .modal-close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 10;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    border: none;
    background-color: rgba(0, 0, 0, 0.5);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s, transform 0.2s;
  }

  .modal-close:hover {
    background-color: rgba(0, 0, 0, 0.75);
    transform: scale(1.1);
  }

  .modal-close:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }

  .modal-img {
    display: block;
    max-width: 90vw;
    max-height: 85vh;
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 0.75rem;
  }

  @media (max-width: 639px) {
    .modal-backdrop {
      padding: 0.5rem;
    }

    .modal-img {
      max-width: 98vw;
      max-height: 90vh;
    }

    .modal-content {
      max-width: 98vw;
      max-height: 90vh;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .modal-backdrop,
    .modal-content {
      transition: none;
    }

    .modal-backdrop.open .modal-content {
      transform: none;
    }
  }
</style>
