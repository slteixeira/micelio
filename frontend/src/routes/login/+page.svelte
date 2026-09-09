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
  <div class="hero">
    <h1 class="wordmark">MICELIO</h1>
    <p class="note">Entre com seu próprio servidor. O Micelio nunca vê sua senha.</p>
  </div>

  <div class="form-plate">
    <form onsubmit={submit}>
      <label class="field">
        <span class="field-label">handle ou url do pds</span>
        <input bind:value={identifier} placeholder="voce.exemplo.com" required />
      </label>
      <Stamp variant="accent" type="submit" disabled={pending}>continuar</Stamp>
    </form>

    {#if pending}<p class="status">redirecionando pro seu servidor…</p>{/if}
    {#if error}<p class="error">{error}</p>{/if}
  </div>
</div>

<style>
  .center {
    max-width: 420px;
    margin: 12vh auto 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .hero {
    background: var(--sage);
    color: var(--ink-on-sage);
    padding: 20px 22px;
  }
  .wordmark {
    font-family: var(--m-display-bare);
    font-size: 72px;
    line-height: 0.92;
    letter-spacing: -0.02em;
    text-transform: uppercase;
  }
  .note {
    font-family: var(--m-mono);
    font-size: 13px;
    line-height: 1.55;
    color: var(--ink-on-sage-mute);
    margin-top: 8px;
  }
  .form-plate {
    background: var(--plate);
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
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
    font-family: var(--m-mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  input {
    width: 100%;
  }
  .status {
    font-family: var(--m-mono);
    font-size: 12px;
    color: var(--sage-dim);
  }
  .error {
    font-family: var(--m-mono);
    font-size: 12px;
    color: var(--ochre);
  }
</style>
