<script lang="ts">
  import { rkeyFromUri, authState, createGoingState } from "$lib/atproto.svelte";
  import DateStub from "./DateStub.svelte";
  import Stamp from "./Stamp.svelte";

  let { event, index }: { event: any; index: number } = $props();

  // Local only — v0 has no endpoint to check an existing RSVP, so this
  // resets on reload. Good enough: it's a write confirmation, not a
  // source of truth.
  const going = createGoingState(event);

  const href = `/events/${event.authorDid}/${rkeyFromUri(event.uri)}`;
</script>

<li class="card">
  <DateStub date={new Date(event.startsAt)} variant={index % 2 === 0 ? "orange" : "bone"} />
  <div class="body">
    <h3 class="title"><a {href}>{event.title}</a></h3>
    {#if event.description}<p class="desc">{event.description}</p>{/if}
    <div class="footer">
      <div class="counts">
        {event.interested} {event.interested === 1 ? "interessado" : "interessados"}
      </div>
      <div class="actions">
        {#if going.state.going}
          <Stamp variant="primary" disabled>vou ✓</Stamp>
        {:else if authState.did}
          <Stamp variant="primary" onclick={going.click}>vou</Stamp>
        {:else}
          <Stamp variant="primary" href="/login">vou</Stamp>
        {/if}
        <Stamp {href} variant="outline">ver antes →</Stamp>
      </div>
    </div>
    {#if going.state.error}<p class="error">{going.state.error}</p>{/if}
  </div>
</li>

<style>
  .card {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr);
    border: var(--rule);
    background: var(--ink-card);
  }
  .body {
    padding: 14px 18px 16px;
    min-width: 0;
  }
  .title {
    font-family: var(--font-display);
    font-size: 38px;
    font-weight: 900;
    line-height: 0.95;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    margin: 0 0 8px;
    overflow-wrap: break-word;
  }
  .title a {
    text-decoration: none;
  }
  .title a:hover {
    color: var(--orange);
  }
  .desc {
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.55;
    color: var(--bone-body);
    max-width: 62ch;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
  .counts {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--bone-count);
    font-weight: 700;
  }
  .actions {
    display: flex;
    gap: 8px;
  }
  .error {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--orange);
    margin-top: 8px;
  }

  @media (max-width: 900px) {
    .card {
      grid-template-columns: 76px minmax(0, 1fr);
    }
  }
</style>
