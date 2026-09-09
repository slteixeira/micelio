<script lang="ts">
  import { rkeyFromUri, authState, createGoingState, blobUrl } from "$lib/atproto.svelte";
  import DateStub from "./DateStub.svelte";
  import Stamp from "./Stamp.svelte";

  let { event, dateVariant = "ochre" }: { event: any; dateVariant?: "ochre" | "sage" } = $props();

  const going = createGoingState(event);
  const href = `/events/${event.authorDid}/${rkeyFromUri(event.uri)}`;
  const image = $derived(event.images?.[0]);
  const imageUrl = $derived(image ? blobUrl(event.authorDid, image.image.ref.$link) : undefined);
</script>

<li class="card">
  <div class="image-block">
    {#if imageUrl}
      <img src={imageUrl} alt={image.alt ?? ""} loading="lazy" />
    {:else}
      <div class="no-image">sem imagem</div>
    {/if}
    <div class="date-corner">
      <DateStub date={new Date(event.startsAt)} variant={dateVariant} numeralSize={32} />
    </div>
  </div>
  <div class="body">
    <h3 class="title"><a {href}>{event.title}</a></h3>
    {#if event.location?.address}<p class="meta">{event.location.address}</p>{/if}
    <div class="footer">
      <div class="counts">
        {event.going ?? 0} {event.going === 1 ? "vai" : "vão"} ·
        {event.interested} {event.interested === 1 ? "interessado" : "interessados"}
      </div>
      <div class="actions">
        {#if going.state.going}
          <Stamp size="sm" variant="outline" disabled>vou ✓</Stamp>
        {:else if authState.did}
          <Stamp size="sm" variant="primary" onclick={going.click}>vou</Stamp>
        {:else}
          <Stamp size="sm" variant="primary" href="/login">vou</Stamp>
        {/if}
      </div>
    </div>
    {#if going.state.error}<p class="error">{going.state.error}</p>{/if}
  </div>
</li>

<style>
  .card {
    display: flex;
    flex-direction: column;
    background: var(--plate);
    border: 1px solid rgba(205, 212, 194, 0.38);
  }
  .image-block {
    position: relative;
    background: var(--plate-deep);
    aspect-ratio: 4 / 3;
  }
  .image-block img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .no-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--m-mono);
    font-size: 11px;
    color: var(--sage-dim);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .date-corner {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }

  .body {
    padding: 14px 16px 16px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }
  .title {
    font-family: var(--m-display);
    font-size: clamp(19px, 1.8vw, 23px);
    line-height: 1.05;
    text-transform: uppercase;
    overflow-wrap: break-word;
  }
  .title a {
    text-decoration: none;
    color: inherit;
  }
  .title a:hover {
    color: var(--ochre);
  }
  .meta {
    font-family: var(--m-mono);
    font-size: 12px;
    color: var(--sage-mute);
  }
  .footer {
    margin-top: auto;
    padding-top: 8px;
    border-top: var(--rule);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .counts {
    font-family: var(--m-mono);
    font-size: 11px;
    color: var(--sage-mute);
    font-weight: 700;
  }
  .actions {
    display: flex;
    gap: 8px;
  }
  .error {
    font-family: var(--m-mono);
    font-size: 11px;
    color: var(--ochre);
  }
</style>
