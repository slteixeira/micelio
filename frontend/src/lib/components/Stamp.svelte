<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    variant = "outline",
    size = "md",
    href,
    disabled = false,
    type = "button",
    onclick,
    children,
  }: {
    variant?: "primary" | "orange" | "outline";
    size?: "sm" | "md";
    href?: string;
    disabled?: boolean;
    type?: "button" | "submit";
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  } = $props();
</script>

{#if href}
  <a class="stamp {variant} {size}" {href}>{@render children()}</a>
{:else}
  <button class="stamp {variant} {size}" {type} {disabled} {onclick}>{@render children()}</button>
{/if}

<style>
  .stamp {
    display: inline-block;
    font-family: var(--font-mono);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-decoration: none;
    border: 1px solid var(--bone);
    background: transparent;
    color: var(--bone);
    cursor: pointer;
    transition: none;
  }
  .stamp.md {
    font-size: 11px;
    padding: 7px 14px;
  }
  .stamp.sm {
    font-size: 11px;
    padding: 4px 9px;
  }
  .stamp.primary {
    background: var(--bone);
    color: var(--ink-base);
    border-color: var(--bone);
  }
  .stamp.orange {
    background: var(--orange);
    color: var(--ink-base);
    border-color: var(--orange);
  }
  .stamp:hover:not(:disabled) {
    background: var(--orange);
    color: var(--ink-base);
    border-color: var(--orange);
  }
  .stamp:disabled {
    border-color: rgba(237, 227, 206, 0.3);
    color: rgba(237, 227, 206, 0.45);
    background: transparent;
    cursor: default;
  }
  .stamp:focus-visible {
    outline: 2px solid var(--orange);
    outline-offset: 0;
  }
</style>
