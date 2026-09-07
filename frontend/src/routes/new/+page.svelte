<script lang="ts">
  import { goto } from "$app/navigation";
  import { authState, createEvent } from "$lib/atproto.svelte";

  let title = $state("");
  let description = $state("");
  let startsAt = $state("");
  let address = $state("");
  let error = $state("");

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = "";
    try {
      await createEvent({
        title,
        description,
        startsAt: new Date(startsAt).toISOString(),
        address,
      });
      goto("/");
    } catch (err) {
      error = err instanceof Error ? err.message : "could not create event";
    }
  }
</script>

<h1>New event</h1>

{#if !authState.did}
  <p>You need to <a href="/login">log in</a> first.</p>
{:else}
  <form onsubmit={submit}>
    <label>
      Title
      <input bind:value={title} required />
    </label>
    <label>
      Description
      <textarea bind:value={description}></textarea>
    </label>
    <label>
      Starts at
      <input type="datetime-local" bind:value={startsAt} required />
    </label>
    <label>
      Address
      <input bind:value={address} placeholder="Praça da Sé, São Paulo" />
    </label>
    <button type="submit">Publish</button>
  </form>

  {#if error}
    <p role="alert">{error}</p>
  {/if}
{/if}
