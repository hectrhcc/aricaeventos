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
    border: 1px solid #2a2a45;
    background-color: #12121f;
    color: #9898c0;
    font-family: inherit;
    transition: background-color 0.18s, color 0.18s, border-color 0.18s, box-shadow 0.18s;
    white-space: nowrap;
  }

  .pill:hover:not(.active) {
    border-color: #7c3aed66;
    color: #c4b5fd;
    background-color: #7c3aed14;
  }

  .pill.active {
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 2px 12px rgba(124, 58, 237, 0.4);
  }
</style>
