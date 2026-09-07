<script lang="ts">
  import { goto } from "$app/navigation";
  import { login } from "$lib/atproto.svelte";

  let identifier = $state("");
  let password = $state("");
  let error = $state("");

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = "";
    try {
      await login(identifier, password);
      goto("/");
    } catch (err) {
      error = err instanceof Error ? err.message : "login failed";
    }
  }
</script>

<h1>Log in</h1>

<form onsubmit={submit}>
  <label>
    Handle or email
    <input bind:value={identifier} required />
  </label>
  <label>
    Password
    <input type="password" bind:value={password} required />
  </label>
  <button type="submit">Log in</button>
</form>

{#if error}
  <p role="alert">{error}</p>
{/if}
