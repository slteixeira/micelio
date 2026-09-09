<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    active = false,
    warn = false,
    onSagePlate = false,
    children,
  }: {
    active?: boolean;
    warn?: boolean;
    onSagePlate?: boolean;
    children: Snippet;
  } = $props();
</script>

<span class="tag" class:active class:warn class:on-sage={onSagePlate}>{@render children()}</span>

<style>
  .tag {
    display: inline-block;
    border: 1px solid rgba(205, 212, 194, 0.5);
    padding: 3px 8px;
    font-family: var(--m-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--sage);
  }
  .tag.active {
    border-color: var(--sage);
    font-weight: 700;
  }
  .tag.warn {
    border-color: transparent;
    background: var(--ochre);
    color: var(--ground);
    font-weight: 700;
  }
  .tag.warn.on-sage {
    background: var(--ochre-deep);
    color: var(--sage);
  }
</style>
