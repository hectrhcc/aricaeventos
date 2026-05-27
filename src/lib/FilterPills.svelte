<script>
  /**
   * FilterPills.svelte
   * Grupo de botones tipo "píldora" para seleccionar filtros.
   * Uso: <FilterPills opciones={[...]} bind:valor />
   */

  /** @type {{ label: string, value: string }[]} */
  let { opciones, valor = $bindable() } = $props();
</script>

<div class="pills-wrap" role="group" aria-label="Filtros">
  {#each opciones as op (op.value)}
    <button
      class="pill"
      class:active={valor === op.value}
      onclick={() => (valor = op.value)}
      aria-pressed={valor === op.value}
    >
      {op.label}
    </button>
  {/each}
</div>

<style>
  .pills-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .pill {
    padding: 0.45rem 1.1rem;
    border-radius: 9999px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--color-border, #d4c5aa);
    background-color: var(--color-bg-card, #ece3d3);
    color: var(--color-text-secondary, #6b5f4d);
    font-family: inherit;
    transition: background-color 0.18s, color 0.18s, border-color 0.18s, box-shadow 0.18s;
    white-space: nowrap;
  }

  .pill:hover:not(.active) {
    border-color: rgba(200, 179, 154, 0.4);
    color: var(--color-text-primary, #2b2418);
    background-color: rgba(200, 179, 154, 0.15);
  }

  .pill.active {
    background: var(--color-accent, #c8b39a);
    border-color: transparent;
    color: #f7f1e8;
    box-shadow: 0 4px 14px rgba(200, 179, 154, 0.2);
  }
</style>
