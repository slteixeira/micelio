<script lang="ts">
  import { authState, profileState } from "$lib/atproto.svelte";
  import EventCard from "$lib/components/EventCard.svelte";
  import ThreadMap from "$lib/components/ThreadMap.svelte";

  let { data } = $props();

  const posted = $derived(data.events.filter((e: any) => e.authorDid === authState.did).length);
</script>

<div class="masthead">
  <h1 class="wordmark">MICELIO</h1>
  <p class="standfirst">
    Nada aqui foi recomendado pra você. Todo evento abaixo atravessou uma corrente de gente que
    confiou nele, de coletivo em coletivo, até chegar no seu terreno.
  </p>
</div>

<ThreadMap />

<div class="grid">
  <div class="feed-col">
    <div class="feed-head">
      <h2>NO MURAL</h2>
      <p class="caption">
        {data.events.length} {data.events.length === 1 ? "evento" : "eventos"} · mais próximos primeiro
      </p>
    </div>

    {#if data.events.length === 0}
      <p class="empty">Nenhum evento ainda.</p>
    {:else}
      <ul class="feed">
        {#each data.events as event, i (event.uri)}
          <EventCard {event} index={i} />
        {/each}
      </ul>
    {/if}
  </div>

  <div class="sidebar">
    {#if authState.did}
      <div class="patch">
        <h3>SEU TERRENO</h3>
        <div class="stats">
          <div class="stat">
            <span class="num orange">{data.events.length}</span>
            <span class="label">eventos ao alcance</span>
          </div>
          <div class="stat">
            <span class="num">{posted}</span>
            <span class="label">você postou</span>
          </div>
        </div>
        {#if profileState.pdsHost}
          <p class="footnote">
            Seu terreno mora em {profileState.pdsHost}. Ninguém mais vê quem você segue.
          </p>
        {/if}
      </div>
    {/if}

    <div class="colophon">
      <p>
        MICELIO roda sobre atproto. Seu feed é seu grafo. Se este servidor cair, pegue seu terreno
        e plante em outro lugar.
      </p>
    </div>
  </div>
</div>

<style>
  .masthead {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 26px 0 18px;
  }
  .wordmark {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: clamp(56px, 12vw, 120px);
    line-height: 0.78;
    letter-spacing: -0.01em;
  }
  .standfirst {
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.55;
    color: rgba(237, 227, 206, 0.75);
    max-width: 420px;
    margin-bottom: 8px;
  }

  .grid {
    display: grid;
    grid-template-columns: minmax(0, 2.4fr) minmax(0, 1fr);
    gap: 34px;
    align-items: start;
    margin-top: 34px;
  }

  .feed-col {
    min-width: 0;
  }
  .feed-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px;
    border-bottom: var(--rule);
    padding-bottom: 8px;
    margin-bottom: 16px;
  }
  .feed-head h2 {
    font-family: var(--font-display);
    font-size: 40px;
    font-weight: 900;
    text-transform: uppercase;
  }
  .feed-head .caption {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--bone-dim);
  }
  .empty {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--bone-dim);
  }
  .feed {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 26px;
  }
  .patch {
    border: var(--rule-strong);
    padding: 14px 16px 16px;
  }
  .patch h3 {
    font-family: var(--font-display);
    font-size: 30px;
    font-weight: 900;
    margin-bottom: 12px;
  }
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: rgba(237, 227, 206, 0.3);
  }
  .stat {
    background: var(--ink-base);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .stat .num {
    font-family: var(--font-display);
    font-size: 34px;
    color: var(--bone);
  }
  .stat .num.orange {
    color: var(--orange);
  }
  .stat .label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--bone-dim);
  }
  .footnote {
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1.5;
    color: var(--bone-dim);
    margin-top: 12px;
  }

  .colophon {
    border-top: var(--rule-strong);
    padding-top: 12px;
  }
  .colophon p {
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1.6;
    color: var(--bone-dim);
  }

  @media (max-width: 900px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
