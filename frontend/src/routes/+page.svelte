<script lang="ts">
  import { rkeyFromUri } from "$lib/atproto.svelte";

  let { data } = $props();
</script>

<h1>micelio</h1>

{#if data.events.length === 0}
  <p>No events yet.</p>
{:else}
  <ul>
    {#each data.events as event}
      <li>
        <a href={`/events/${event.authorDid}/${rkeyFromUri(event.uri)}`}>
          <strong>{event.title}</strong>
        </a>
        <span>{new Date(event.startsAt).toLocaleString()}</span>
        <span>· {event.interested} interested</span>
      </li>
    {/each}
  </ul>
{/if}
