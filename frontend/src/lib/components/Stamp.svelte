<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    variant = "outline",
    size = "md",
    onSagePlate = false,
    href,
    disabled = false,
    type = "button",
    onclick,
    children,
  }: {
    variant?: "primary" | "accent" | "outline";
    size?: "sm" | "md";
    onSagePlate?: boolean;
    href?: string;
    disabled?: boolean;
    type?: "button" | "submit";
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  } = $props();
</script>

{#if href}
  <a class="stamp {variant} {size}" class:on-sage={onSagePlate} {href}>{@render children()}</a>
{:else}
  <button class="stamp {variant} {size}" class:on-sage={onSagePlate} {type} {disabled} {onclick}
    >{@render children()}</button
  >
{/if}

<style>
  .stamp {
    display: inline-block;
    font-family: var(--m-mono);
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-decoration: none;
    border: 1px solid var(--sage);
    background: transparent;
    color: var(--sage);
    cursor: pointer;
    transition: none;
    border-radius: 0;
  }
  .stamp.md {
    font-size: 12px;
    padding: 9px 18px;
  }
  .stamp.sm {
    font-size: 12px;
    padding: 7px 14px;
    letter-spacing: 0.13em;
  }
  .stamp.primary {
    background: var(--sage);
    color: var(--ground);
    border-color: var(--sage);
  }
  .stamp.primary.on-sage {
    background: var(--ground);
    color: var(--sage);
    border-color: var(--ground);
  }
  .stamp.accent {
    background: var(--ochre);
    color: var(--ground);
    border-color: var(--ochre);
  }
  .stamp.outline {
    background: transparent;
  }
  .stamp:hover:not(:disabled) {
    background: var(--sage);
    color: var(--ground);
    border-color: var(--sage);
  }
  .stamp.on-sage:hover:not(:disabled) {
    background: var(--ground);
    color: var(--sage);
    border-color: var(--ground);
  }
  .stamp:disabled {
    border-color: rgba(205, 212, 194, 0.3);
    color: var(--sage-dim);
    background: transparent;
    cursor: default;
  }
  .stamp:focus-visible {
    outline: 2px solid var(--ochre);
    outline-offset: 0;
  }
</style>
