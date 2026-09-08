<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { authState, profileState, logout } from "$lib/atproto.svelte";
  import Stamp from "./Stamp.svelte";

  async function handleLogout() {
    await logout();
    goto("/");
  }
</script>

<div class="identity-rule">
  <div class="who">
    {#if authState.did}
      logado como <span class="handle">@{profileState.handle ?? authState.did}</span>
      {#if profileState.pdsHost}
        <span class="dim"> · {profileState.pdsHost} (seu próprio servidor)</span>
      {/if}
    {:else}
      <a href="/login">entrar</a>
    {/if}
  </div>
  <nav>
    <Stamp href="/" size="sm" variant={page.url.pathname === "/" ? "primary" : "outline"}
      >feed</Stamp
    >
    <Stamp href="/new" size="sm" variant={page.url.pathname === "/new" ? "primary" : "outline"}
      >postar</Stamp
    >
    {#if authState.did}
      <Stamp size="sm" onclick={handleLogout}>sair</Stamp>
    {/if}
  </nav>
</div>

<style>
  .identity-rule {
    border-bottom: var(--rule-strong);
    padding: 14px 0 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 12px;
    letter-spacing: 0.04em;
  }
  .handle {
    color: var(--orange);
    font-weight: 700;
  }
  .dim {
    color: var(--bone-dim);
  }
  nav {
    display: flex;
    gap: 8px;
  }
</style>
