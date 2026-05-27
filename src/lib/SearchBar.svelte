<script>
  /**
   * SearchBar.svelte
   * Input de búsqueda con ícono y botón de limpiar.
   * Uso: <SearchBar bind:valor placeholder="..." />
   */

  let { valor = $bindable(''), placeholder = 'Buscar eventos…' } = $props();
</script>

<div class="search-wrap">
  <!-- Ícono lupa -->
  <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd" />
  </svg>

  <input
    id="search-input"
    type="search"
    autocomplete="off"
    spellcheck="false"
    bind:value={valor}
    {placeholder}
    aria-label="Buscar eventos"
  />

  <!-- Botón limpiar (solo visible si hay texto) -->
  {#if valor}
    <button
      class="clear-btn"
      onclick={() => (valor = '')}
      aria-label="Limpiar búsqueda"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
      </svg>
    </button>
  {/if}
</div>

<style>
  .search-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    width: 1.1rem;
    height: 1.1rem;
    color: var(--color-text-muted, #9d8f7a);
    pointer-events: none;
    flex-shrink: 0;
    transition: color 0.2s;
  }

  input {
    width: 100%;
    padding: 0.8rem 2.8rem 0.8rem 2.75rem;
    border-radius: 0.875rem;
    border: 1px solid var(--color-border, #d4c5aa);
    background-color: var(--color-bg-card, #ece3d3);
    color: var(--color-text-primary, #2b2418);
    font-size: 0.95rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
    -webkit-appearance: none;
  }

  input::placeholder { color: var(--color-text-muted, #9d8f7a); }

  input:focus {
    border-color: var(--color-accent, #c8b39a);
    box-shadow: 0 0 0 3px rgba(200, 179, 154, 0.2);
    background-color: var(--color-bg-surface, #e4d9c5);
  }

  input:focus + :global(.search-icon) {
    color: var(--color-accent, #c8b39a);
  }

  /* Ocultar el icono "x" nativo de algunos browsers */
  input[type="search"]::-webkit-search-cancel-button { display: none; }

  .clear-btn {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 50%;
    color: var(--color-text-muted, #9d8f7a);
    display: flex;
    align-items: center;
    transition: color 0.15s, background-color 0.15s;
  }

  .clear-btn svg {
    width: 1rem;
    height: 1rem;
  }

  .clear-btn:hover {
    color: var(--color-text-primary, #2b2418);
    background-color: var(--color-border, #d4c5aa);
  }

  .clear-btn:focus-visible {
    outline: 2px solid var(--color-accent, #c8b39a);
    outline-offset: 2px;
  }
</style>
