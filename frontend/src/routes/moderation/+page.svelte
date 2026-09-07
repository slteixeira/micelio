<script lang="ts">
  import { browser } from "$app/environment";
  import { fetchReportedEvents, setEventHidden } from "$lib/appview";
  import { rkeyFromUri } from "$lib/atproto.svelte";

  const TOKEN_KEY = "micelio-admin-token";

  let token = $state(browser ? (sessionStorage.getItem(TOKEN_KEY) ?? "") : "");
  let events = $state<any[]>([]);
  let error = $state("");

  async function load() {
    error = "";
    try {
      events = await fetchReportedEvents(token);
      if (browser) sessionStorage.setItem(TOKEN_KEY, token);
    } catch (err) {
      error = err instanceof Error ? err.message : "failed to load";
    }
  }

  async function toggleHidden(e: any) {
    try {
      const hidden = !e.hidden;
      await setEventHidden(e.authorDid, rkeyFromUri(e.uri), hidden, token);
      events = events.map((x) => (x.uri === e.uri ? { ...x, hidden } : x));
    } catch (err) {
      error = err instanceof Error ? err.message : "action failed";
    }
  }

  if (browser && token) load();
</script>

<h1>Moderation queue</h1>

<label>
  Admin token
  <input type="password" bind:value={token} />
</label>
<button onclick={load}>Load reports</button>

{#if error}<p role="alert">{error}</p>{/if}

<ul>
  {#each events as e}
    <li>
      {#if e.deleted}
        <em>{e.uri}</em> (record no longer exists) — {e.reportCount} report(s): {e.reasons}
      {:else}
        <strong>{e.title}</strong> {e.hidden ? "(hidden)" : ""}
        — {e.reportCount} report(s): {e.reasons}
        <button onclick={() => toggleHidden(e)}>{e.hidden ? "Unhide" : "Hide"}</button>
      {/if}
    </li>
  {/each}
</ul>
