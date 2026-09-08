<script lang="ts">
  import { authState, createGoingState, errorMessage, blobUrl } from "$lib/atproto.svelte";
  import { markInterested, reportEvent, postComment } from "$lib/appview";
  import Stamp from "$lib/components/Stamp.svelte";
  import ImageCarousel from "$lib/components/ImageCarousel.svelte";

  let { data } = $props();
  let event = $state(data.event);
  const images = $derived(
    (event.images ?? []).map((img: any) => ({
      url: blobUrl(event.authorDid, img.image.ref.$link),
      alt: img.alt,
    })),
  );
  const going = createGoingState(event);
  let reporting = $state(false);
  let reportReason = $state("");
  let reportStatus = $state("");
  let comments = $state(data.comments);
  let commentBody = $state("");
  let commentError = $state("");
  let posting = $state(false);

  async function interestedClick() {
    const interested = await markInterested(data.did, data.rkey);
    event = { ...event, interested };
  }

  async function reportClick() {
    await reportEvent(data.did, data.rkey, reportReason);
    reportStatus = "denúncia enviada · um moderador vai ver";
  }

  async function submitComment() {
    if (!commentBody.trim()) return;
    posting = true;
    commentError = "";
    try {
      const comment = await postComment(data.did, data.rkey, commentBody);
      comments = [...comments, comment];
      commentBody = "";
    } catch (err) {
      commentError = errorMessage(err, "falha ao comentar");
    } finally {
      posting = false;
    }
  }
</script>

<article>
  <h1 class="title">{event.title}</h1>

  <ImageCarousel {images} />

  <div class="meta-strip">
    <div class="meta">
      <span class="label">quando</span>
      <span class="value">{new Date(event.startsAt).toLocaleString("pt-BR")}</span>
    </div>
    {#if event.location?.address}
      <div class="meta">
        <span class="label">onde</span>
        <span class="value">{event.location.address}</span>
      </div>
    {/if}
  </div>

  {#if event.description}<p class="body">{event.description}</p>{/if}

  <div class="action-bar">
    {#if going.state.going}
      <Stamp variant="outline" disabled>vou ✓</Stamp>
    {:else if authState.did}
      <Stamp variant="primary" onclick={going.click}>vou</Stamp>
    {:else}
      <Stamp variant="primary" href="/login">vou</Stamp>
    {/if}
    <Stamp variant="outline" onclick={interestedClick}>interessado</Stamp>
    <button class="report-link" onclick={() => (reporting = !reporting)}>denunciar</button>
  </div>
  {#if going.state.error}<p class="error">{going.state.error}</p>{/if}

  <p class="counts">
    {event.interested} {event.interested === 1 ? "interessado" : "interessados"} (anônimo, não verificado)
  </p>

  {#if reporting}
    <div class="report-panel">
      {#if reportStatus}
        <p class="report-status">{reportStatus}</p>
      {:else}
        <input bind:value={reportReason} placeholder="motivo (opcional)" />
        <Stamp variant="orange" onclick={reportClick}>enviar denúncia</Stamp>
      {/if}
    </div>
  {/if}

  <div class="host-block">
    <p>{event.authorDid}</p>
    <p>{event.uri}</p>
  </div>

  <section class="comments">
    <h2 class="comments-title">comentários ({comments.length}) <span class="tag">anônimo, não verificado</span></h2>

    {#if comments.length === 0}
      <p class="empty">nenhum comentário ainda</p>
    {:else}
      <ul class="comment-list">
        {#each comments as c (c.id)}
          <li class="comment">
            <p class="comment-meta">
              <span class="comment-name">{c.name}</span>
              <span class="comment-date">{new Date(c.createdAt).toLocaleString("pt-BR")}</span>
            </p>
            <p class="comment-body">{c.body}</p>
          </li>
        {/each}
      </ul>
    {/if}

    <div class="comment-form">
      <textarea
        bind:value={commentBody}
        placeholder="deixe um comentário anônimo"
        maxlength="2000"
        rows="3"
      ></textarea>
      <Stamp variant="outline" onclick={submitComment} disabled={posting || !commentBody.trim()}>
        {posting ? "enviando..." : "comentar"}
      </Stamp>
    </div>
    {#if commentError}<p class="error">{commentError}</p>{/if}
  </section>
</article>

<style>
  article {
    max-width: 820px;
    margin-top: 34px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .title {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: clamp(38px, 6vw, 64px);
    line-height: 0.92;
    text-transform: uppercase;
    overflow-wrap: break-word;
  }
  .meta-strip {
    border-top: var(--rule);
    border-bottom: var(--rule);
    padding: 10px 0;
    display: flex;
    gap: 28px;
    flex-wrap: wrap;
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .meta {
    display: flex;
    gap: 8px;
  }
  .meta .label {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--bone-dim);
  }
  .body {
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.6;
    max-width: 62ch;
    color: var(--bone-body);
  }
  .action-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .report-link {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--orange);
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .error {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--orange);
  }
  .counts {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--bone-count);
  }
  .report-panel {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .report-panel input {
    flex: 1;
    min-width: 200px;
  }
  .report-status {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--bone);
  }
  .host-block {
    border-top: var(--rule-faint);
    padding-top: 12px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--bone-dim);
    user-select: all;
    word-break: break-all;
  }
  .comments {
    border-top: var(--rule);
    padding-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .comments-title {
    font-family: var(--font-mono);
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .comments-title .tag {
    font-size: 10px;
    color: var(--bone-dim);
    text-transform: none;
    letter-spacing: normal;
  }
  .empty {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--bone-dim);
  }
  .comment-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .comment {
    border-bottom: var(--rule-faint);
    padding-bottom: 10px;
  }
  .comment-meta {
    display: flex;
    gap: 8px;
    align-items: baseline;
    margin-bottom: 4px;
  }
  .comment-name {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    color: var(--bone);
  }
  .comment-date {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--bone-dim);
  }
  .comment-body {
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .comment-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  .comment-form textarea {
    width: 100%;
    resize: vertical;
    font-family: var(--font-mono);
    font-size: 13px;
  }
</style>
