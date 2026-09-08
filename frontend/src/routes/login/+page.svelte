<script lang="ts">
  import { login, errorMessage } from "$lib/atproto.svelte";
  import Stamp from "$lib/components/Stamp.svelte";

  let identifier = $state("");
  let error = $state("");
  let pending = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = "";
    pending = true;
    try {
      await login(identifier); // redirects to the user's PDS on success, never returns here
    } catch (err) {
      pending = false;
      error = errorMessage(err, "falha ao entrar");
    }
  }
</script>

<div class="center">
  <h1 class="wordmark">MICELIO</h1>
  <p class="note">Entre com seu próprio servidor. O Micelio nunca vê sua senha.</p>

  <form onsubmit={submit}>
    <label class="field">
      <span class="field-label">handle ou url do pds</span>
      <input bind:value={identifier} placeholder="voce.exemplo.com" required />
    </label>
    <Stamp variant="orange" type="submit" disabled={pending}>continuar</Stamp>
  </form>

  {#if pending}<p class="status">redirecionando pro seu servidor…</p>{/if}
  {#if error}<p class="error">{error}</p>{/if}
</div>

<style>
  .center {
    max-width: 420px;
    margin: 15vh auto 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .wordmark {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 72px;
    line-height: 0.85;
  }
  .note {
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.55;
    color: var(--bone-dim);
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  input {
    width: 100%;
  }
  .status {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--bone-dim);
  }
  .error {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--orange);
  }
</style>
