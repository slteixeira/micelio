<script lang="ts">
  import { authState } from "$lib/atproto.svelte";
  import EventCard from "$lib/components/EventCard.svelte";
  import MastheadBand from "$lib/components/MastheadBand.svelte";
  import Tag from "$lib/components/Tag.svelte";

  let { data } = $props();

  const posted = $derived(data.events.filter((e: any) => e.authorDid === authState.did).length);
</script>

<MastheadBand
  description="Sem curadoria, sem algoritmo de recomendação — a lista abaixo é todo evento publicado no seu servidor, em ordem cronológica."
>
  {#snippet stamps()}
    <Tag active>{data.events.length} {data.events.length === 1 ? "evento" : "eventos"}</Tag>
    {#if authState.did}
      <Tag>{posted} {posted === 1 ? "postado por você" : "postados por você"}</Tag>
    {/if}
  {/snippet}
</MastheadBand>

<div class="feed-head">
  <h2>NO MURAL</h2>
  <p class="caption">
    {data.events.length} {data.events.length === 1 ? "evento" : "eventos"} · mais próximos
    primeiro
  </p>
</div>

{#if data.events.length === 0}
  <p class="empty">Nenhum evento ainda.</p>
{:else}
  <ul class="grid">
    {#each data.events as event, i (event.uri)}
      <EventCard {event} dateVariant={i % 2 === 0 ? "ochre" : "sage"} />
    {/each}
  </ul>
{/if}

<div class="colophon">
  <p>
    MICELIO roda sobre atproto. Seu feed é seu grafo. Se este servidor cair, pegue seu terreno e
    plante em outro lugar.
  </p>
</div>

<style>
  .feed-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 8px 16px;
    background: var(--plate);
    padding: 12px 14px;
    margin-top: 22px;
    margin-bottom: 18px;
  }
  .feed-head h2 {
    font-family: var(--m-display-bare);
    font-size: clamp(26px, 3.4vw, 38px);
    line-height: 1.02;
    text-transform: uppercase;
  }
  .feed-head .caption {
    background: var(--ochre);
    color: var(--ground);
    font-family: var(--m-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 8px;
    margin-bottom: 6px;
  }
  .empty {
    font-family: var(--m-mono);
    font-size: 13px;
    color: var(--sage-dim);
    background: var(--plate);
    padding: 16px;
    border: var(--rule-dashed);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .colophon {
    background: var(--plate);
    padding: 14px 16px;
    border-top: var(--rule-3);
    margin-top: 28px;
  }
  .colophon p {
    font-family: var(--m-mono);
    font-size: 11px;
    line-height: 1.6;
    color: var(--sage-dim);
  }

  @media (max-width: 480px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
