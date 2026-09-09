<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    compact = false,
    description,
    stamps,
  }: {
    compact?: boolean;
    description: string;
    stamps?: Snippet;
  } = $props();
</script>

<div class="masthead">
  <div class="cell wordmark-cell">
    <div class="wordmark" class:compact>MICELIO</div>
    <div class="descriptor">event board · são paulo · roda em atproto</div>
  </div>
  <div class="cell standfirst-cell">
    <p class="standfirst">{description}</p>
    {#if stamps}<div class="stamps">{@render stamps()}</div>{/if}
  </div>
</div>

<style>
  .masthead {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  }
  @media (max-width: 640px) {
    .masthead {
      grid-template-columns: 1fr;
    }
  }
  .cell {
    padding: 18px 20px;
  }
  .wordmark-cell {
    background: var(--sage);
    color: var(--ground);
  }
  .wordmark {
    font-family: var(--m-display-bare);
    font-size: clamp(44px, 8.6vw, 104px);
    line-height: 0.92;
    letter-spacing: -0.02em;
    text-transform: uppercase;
  }
  .wordmark.compact {
    font-size: 56px;
  }
  .descriptor {
    font-family: var(--m-mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-top: 6px;
  }
  .standfirst-cell {
    background: var(--plate);
    border: 3px solid var(--sage);
    border-left-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 14px;
  }
  .standfirst {
    font-family: var(--m-mono);
    font-size: 15px;
    line-height: 1.65;
    color: var(--sage-bright);
    border-left: 3px solid var(--ochre);
    padding-left: 14px;
    max-width: 56ch;
  }
  .stamps {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    padding-left: 17px;
  }
</style>
