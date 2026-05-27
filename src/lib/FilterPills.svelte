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
    border: 1px solid var(--color-border, #242930);
    background-color: var(--color-bg-card, #16191d);
    color: var(--color-text-secondary, #a1a8b3);
    font-family: inherit;
    transition: background-color 0.18s, color 0.18s, border-color 0.18s, box-shadow 0.18s;
    white-space: nowrap;
  }

  .pill:hover:not(.active) {
    border-color: rgba(200, 179, 154, 0.4);
    color: var(--color-text-primary, #f5f2ee);
    background-color: rgba(200, 179, 154, 0.08);
  }

  .pill.active {
    background: var(--color-accent, #c8b39a);
    border-color: transparent;
    color: var(--color-bg-base, #0e1012);
    box-shadow: 0 4px 14px rgba(200, 179, 154, 0.2);
  }
</style>
