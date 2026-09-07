<script lang="ts">
  import { authState, rsvp } from "$lib/atproto.svelte";
  import { markInterested, reportEvent } from "$lib/appview";

  let { data } = $props();
  let event = $state(data.event);
  let rsvpStatus = $state("");
  let reportReason = $state("");
  let reportStatus = $state("");

  async function goingClick() {
    rsvpStatus = "";
    try {
      await rsvp(event);
      rsvpStatus = "You're marked as going.";
    } catch (err) {
      rsvpStatus = err instanceof Error ? err.message : "RSVP failed";
    }
  }

  async function interestedClick() {
    const interested = await markInterested(data.did, data.rkey);
    event = { ...event, interested };
  }

  async function reportClick() {
    await reportEvent(data.did, data.rkey, reportReason);
    reportReason = "";
    reportStatus = "Reported to moderators.";
  }
</script>

<h1>{event.title}</h1>
<p>{new Date(event.startsAt).toLocaleString()}</p>
{#if event.location?.address}<p>{event.location.address}</p>{/if}
{#if event.description}<p>{event.description}</p>{/if}

<p>{event.interested} interested (anonymous, unverified)</p>
<button onclick={interestedClick}>I'm interested</button>

{#if authState.did}
  <button onclick={goingClick}>RSVP: going</button>
{:else}
  <p><a href="/login">Log in</a> to RSVP with your account.</p>
{/if}

{#if rsvpStatus}<p role="status">{rsvpStatus}</p>{/if}

<details>
  <summary>Report this event</summary>
  <input bind:value={reportReason} placeholder="Reason (optional)" />
  <button onclick={reportClick}>Report</button>
  {#if reportStatus}<p role="status">{reportStatus}</p>{/if}
</details>
