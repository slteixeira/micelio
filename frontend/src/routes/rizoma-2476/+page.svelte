<script lang="ts">
  import { browser } from "$app/environment";
  import {
    fetchReportedEvents,
    setEventHidden,
    fetchAllComments,
    deleteComment,
  } from "$lib/appview";
  import { rkeyFromUri, didFromUri, errorMessage } from "$lib/atproto.svelte";
  import Stamp from "$lib/components/Stamp.svelte";
  import Tag from "$lib/components/Tag.svelte";
  import MastheadBand from "$lib/components/MastheadBand.svelte";

  const TOKEN_KEY = "micelio-admin-token";

  let token = $state(browser ? (sessionStorage.getItem(TOKEN_KEY) ?? "") : "");
  let events = $state<any[]>([]);
  let comments = $state<any[]>([]);
  let error = $state("");
  let filter = $state<"open" | "hidden" | "all">("open");
  const filters = ["open", "hidden", "all"] as const;
  const filterLabels: Record<(typeof filters)[number], string> = {
    open: "abertos",
    hidden: "ocultos",
    all: "todos",
  };

  const counts = $derived.by(() => {
    let open = 0;
    let hidden = 0;
    for (const e of events) if (e.hidden) hidden++; else open++;
    return { open, hidden };
  });
  const filtered = $derived(
    filter === "all" ? events : events.filter((e) => Boolean(e.hidden) === (filter === "hidden")),
  );

  async function load() {
    error = "";
    try {
      [events, comments] = await Promise.all([fetchReportedEvents(token), fetchAllComments(token)]);
      if (browser) sessionStorage.setItem(TOKEN_KEY, token);
    } catch (err) {
      error = errorMessage(err, "falha ao carregar");
    }
  }

  async function toggleHidden(e: any) {
    const hidden = !e.hidden;
    events = events.map((x) => (x.uri === e.uri ? { ...x, hidden } : x));
    try {
      await setEventHidden(e.authorDid, rkeyFromUri(e.uri), hidden, token);
    } catch (err) {
      events = events.map((x) => (x.uri === e.uri ? { ...x, hidden: e.hidden } : x));
      error = errorMessage(err, "ação falhou");
    }
  }

  async function removeComment(c: any) {
    const prev = comments;
    comments = comments.filter((x) => x.id !== c.id);
    try {
      await deleteComment(didFromUri(c.eventUri), rkeyFromUri(c.eventUri), c.id, token);
    } catch (err) {
      comments = prev;
      error = errorMessage(err, "ação falhou");
    }
  }

  if (browser && token) load();
</script>

<MastheadBand compact description="fila de moderação" />
<div class="control-plate">
  <div class="head">
    <h1>FILA</h1>
    <p class="counts">
      {counts.open} abertos · {counts.hidden} ocultos
    </p>
  </div>

  <div class="token-row">
    <input type="password" bind:value={token} placeholder="token de administrador" />
    <Stamp variant="outline" onclick={load}>carregar fila</Stamp>
  </div>

  {#if error}<p class="error">{error}</p>{/if}

  <div class="filter-row">
    {#each filters as f}
      <Stamp size="sm" variant={filter === f ? "primary" : "outline"} onclick={() => (filter = f)}
        >{filterLabels[f]}</Stamp
      >
    {/each}
  </div>
</div>

{#if filtered.length === 0}
  <p class="empty">nada na fila</p>
{:else}
  <ul>
    {#each filtered as e (e.uri)}
      <li class="row" class:hidden={e.hidden}>
        <div class="info">
          {#if e.deleted}
            <p class="reason">registro não existe mais</p>
            <p class="uri">{e.uri}</p>
          {:else}
            <p class="reason">
              {e.reasons ?? "nenhum motivo informado"}
              {#if e.hidden}<Tag warn>oculto</Tag>{/if}
            </p>
            <p class="event-title">{e.title}</p>
            <p class="meta">{e.reportCount} denúncia(s) · {e.uri}</p>
          {/if}
        </div>
        {#if !e.deleted}
          <div class="actions">
            <Stamp
              variant={e.hidden ? "outline" : "accent"}
              onclick={() => toggleHidden(e)}
            >
              {e.hidden ? "reexibir" : "ocultar"}
            </Stamp>
            <Stamp variant="outline" href={`/events/${e.authorDid}/${rkeyFromUri(e.uri)}`}
              >abrir</Stamp
            >
          </div>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<div class="control-plate head">
  <h2>COMENTÁRIOS</h2>
  <p class="counts">
    {comments.length} {comments.length === 1 ? "comentário" : "comentários"} · sem fila de
    denúncia, revise direto
  </p>
</div>

{#if comments.length === 0}
  <p class="empty">nenhum comentário</p>
{:else}
  <ul>
    {#each comments as c (c.id)}
      <li class="row">
        <div class="info">
          <p class="reason">{c.name}</p>
          <p class="comment-body">{c.body}</p>
          <p class="meta">{c.eventTitle ?? "evento não existe mais"} · {c.eventUri}</p>
        </div>
        <div class="actions">
          <Stamp variant="accent" onclick={() => removeComment(c)}>apagar</Stamp>
          <Stamp variant="outline" href={`/events/${didFromUri(c.eventUri)}/${rkeyFromUri(c.eventUri)}`}
            >abrir</Stamp
          >
        </div>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .head {
    padding: 26px 0 10px;
    display: flex;
    align-items: baseline;
    gap: 16px;
    flex-wrap: wrap;
  }
  .head h1,
  .head h2 {
    font-family: var(--m-display-bare);
    font-size: clamp(26px, 3.4vw, 38px);
    line-height: 1.02;
    text-transform: uppercase;
  }
  .counts {
    font-family: var(--m-mono);
    font-size: 12px;
    color: var(--sage-dim);
  }
  .token-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    max-width: 480px;
    margin-bottom: 16px;
  }
  .token-row input {
    flex: 1;
  }
  .error {
    font-family: var(--m-mono);
    font-size: 12px;
    color: var(--ochre);
    margin-bottom: 12px;
  }
  .filter-row {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  .empty {
    font-family: var(--m-mono);
    font-size: 13px;
    background: var(--plate);
    border: var(--rule-dashed);
    padding: 18px;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    align-items: center;
    background: var(--plate);
    border-bottom: var(--rule);
    padding: 14px 16px;
  }
  @media (max-width: 480px) {
    .row {
      grid-template-columns: 1fr;
    }
    .actions {
      margin-top: 10px;
    }
  }
  .row.hidden {
    border-left: 3px solid var(--ochre);
    padding-left: 12px;
  }
  .reason {
    font-family: var(--m-mono);
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .event-title {
    font-family: var(--m-display-bare);
    font-size: 21px;
    line-height: 1.15;
    margin: 4px 0;
    overflow-wrap: break-word;
  }
  .meta,
  .uri {
    font-family: var(--m-mono);
    font-size: 11px;
    color: var(--sage-dim);
    word-break: break-all;
  }
  .comment-body {
    font-family: var(--m-mono);
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    margin: 4px 0;
  }
  .actions {
    display: flex;
    gap: 8px;
  }
</style>
