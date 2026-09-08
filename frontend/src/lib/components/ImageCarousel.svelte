<script lang="ts">
  let { images }: { images: { url: string; alt?: string }[] } = $props();

  let track: HTMLDivElement;
  let index = $state(0);

  // index tracks the real scroll position (via the scroll listener below)
  // rather than being maintained independently — a manual swipe/drag on
  // the track (the primary interaction on phones) has to move the dots
  // too, not just clicking prev/next.
  function scrollTo(i: number) {
    track?.children[Math.max(0, Math.min(images.length - 1, i))]?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
    });
  }

  function onScroll() {
    if (!track || !track.clientWidth) return;
    index = Math.round(track.scrollLeft / track.clientWidth);
  }
</script>

{#if images.length > 0}
  <div class="carousel">
    <div class="track" bind:this={track} onscroll={onScroll}>
      {#each images as img (img.url)}
        <img src={img.url} alt={img.alt ?? ""} loading="lazy" />
      {/each}
    </div>
    {#if images.length > 1}
      <button class="nav prev" type="button" onclick={() => scrollTo(index - 1)} aria-label="anterior">‹</button>
      <button class="nav next" type="button" onclick={() => scrollTo(index + 1)} aria-label="próxima">›</button>
      <div class="dots">
        {#each images as _, i}
          <button
            type="button"
            class="dot"
            class:active={i === index}
            onclick={() => scrollTo(i)}
            aria-label={`imagem ${i + 1}`}
          ></button>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .carousel {
    position: relative;
  }
  .track {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 0;
    border: var(--rule);
  }
  .track img {
    flex: 0 0 100%;
    scroll-snap-align: start;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }
  .nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: var(--ink-base);
    color: var(--bone);
    border: 1px solid var(--bone);
    width: 32px;
    height: 32px;
    font-size: 18px;
    cursor: pointer;
    line-height: 1;
  }
  .nav.prev {
    left: 8px;
  }
  .nav.next {
    right: 8px;
  }
  .dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    padding: 8px 0;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1px solid var(--bone);
    background: transparent;
    padding: 0;
    cursor: pointer;
  }
  .dot.active {
    background: var(--orange);
    border-color: var(--orange);
  }
</style>
