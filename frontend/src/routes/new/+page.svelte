<script lang="ts">
  import { authState, createEvent, errorMessage, MAX_EVENT_IMAGES } from "$lib/atproto.svelte";
  import Stamp from "$lib/components/Stamp.svelte";

  let title = $state("");
  let description = $state("");
  let startsAt = $state("");
  let endsAt = $state("");
  let address = $state("");
  let error = $state("");
  let submitting = $state(false);
  let resultUri = $state("");
  let images = $state<File[]>([]);

  // Object URLs are created once per File and revoked once it leaves
  // `images` — re-deriving previews on every change would otherwise
  // re-create (and leak) a URL for every file, not just the new ones.
  let previewMap = new Map<File, string>();
  let previews = $state<string[]>([]);
  $effect(() => {
    const next = new Map<File, string>();
    for (const f of images) next.set(f, previewMap.get(f) ?? URL.createObjectURL(f));
    for (const [f, url] of previewMap) if (!next.has(f)) URL.revokeObjectURL(url);
    previewMap = next;
    previews = images.map((f) => next.get(f)!);
  });
  $effect(() => () => {
    for (const url of previewMap.values()) URL.revokeObjectURL(url);
  });

  function addImages(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    images = [...images, ...files].slice(0, MAX_EVENT_IMAGES);
  }

  function removeImage(i: number) {
    images = images.filter((_, idx) => idx !== i);
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = "";
    submitting = true;
    try {
      const res = await createEvent({
        title,
        description,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        address,
        images,
      });
      resultUri = res.data.uri;
    } catch (err) {
      error = errorMessage(err, "não foi possível criar o evento");
    } finally {
      submitting = false;
    }
  }
</script>

<div class="head">
  <h1>POSTAR UM EVENTO</h1>
  <p class="note">Isso vai pro seu servidor. Chega até as pessoas pelos coletivos que confiam em você.</p>
</div>

{#if !authState.did}
  <p class="need-login">Você precisa <a href="/login">entrar</a> primeiro.</p>
{:else if resultUri}
  <div class="success">
    <p class="uri">{resultUri}</p>
    <Stamp variant="outline" href="/">ver</Stamp>
  </div>
{:else}
  <form onsubmit={submit} class:submitting>
    <label class="field">
      <span class="field-label">título <span class="req">*</span></span>
      <input bind:value={title} maxlength="300" required />
    </label>
    <label class="field">
      <span class="field-label">descrição</span>
      <textarea bind:value={description} maxlength="3000" rows="4"></textarea>
    </label>
    <label class="field">
      <span class="field-label">começa em <span class="req">*</span></span>
      <input type="datetime-local" bind:value={startsAt} required />
    </label>
    <label class="field">
      <span class="field-label">termina em</span>
      <input type="datetime-local" bind:value={endsAt} />
    </label>
    <label class="field">
      <span class="field-label">local</span>
      <input bind:value={address} placeholder="Praça da Sé, São Paulo" maxlength="500" />
    </label>
    <label class="field">
      <span class="field-label">imagens (até {MAX_EVENT_IMAGES})</span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        disabled={images.length >= MAX_EVENT_IMAGES}
        onchange={addImages}
      />
      {#if previews.length > 0}
        <div class="image-previews">
          {#each previews as src, i}
            <div class="preview">
              <img {src} alt="" />
              <button type="button" class="remove" onclick={() => removeImage(i)}>×</button>
            </div>
          {/each}
        </div>
      {/if}
    </label>

    <div class="submit-row">
      <Stamp variant="orange" type="submit" disabled={submitting}>
        {submitting ? "publicando…" : "publicar"}
      </Stamp>
      <Stamp variant="outline" href="/">cancelar</Stamp>
    </div>

    {#if error}
      <p class="error">{error}</p>
    {/if}
  </form>
{/if}

<style>
  .head {
    padding: 26px 0 18px;
  }
  .head h1 {
    font-family: var(--font-display);
    font-size: 40px;
    font-weight: 900;
    text-transform: uppercase;
  }
  .note {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--bone-dim);
    margin-top: 6px;
  }
  .need-login {
    font-family: var(--font-mono);
    font-size: 12px;
  }
  form {
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  form.submitting {
    opacity: 0.6;
    pointer-events: none;
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
  .req {
    color: var(--orange);
  }
  input,
  textarea {
    width: 100%;
  }
  .submit-row {
    display: flex;
    gap: 8px;
  }
  .error {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--orange);
  }
  .success {
    border: var(--rule-strong);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    max-width: 640px;
  }
  .success .uri {
    font-family: var(--font-mono);
    font-size: 10px;
    word-break: break-all;
  }
  .image-previews {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 8px;
  }
  .preview {
    position: relative;
    width: 88px;
    height: 88px;
  }
  .preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: var(--rule);
  }
  .preview .remove {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    line-height: 18px;
    text-align: center;
    background: var(--orange);
    color: var(--ink-base);
    border: 1px solid var(--ink-base);
    cursor: pointer;
    font-weight: 700;
  }
</style>
