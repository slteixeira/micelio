<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { authState, profileState, logout } from "$lib/atproto.svelte";

  async function handleLogout() {
    await logout();
    goto("/");
  }

  const navItems = [
    { href: "/", label: "feed" },
    { href: "/new", label: "postar" },
  ];
</script>

<div class="identity-bar">
  <div class="who">
    {#if authState.did}
      logado como <span class="handle">@{profileState.handle ?? authState.did}</span>
      {#if profileState.pdsHost}
        <span class="sep">·</span> {profileState.pdsHost} (seu próprio servidor)
      {/if}
    {:else}
      <a href="/login">entrar</a>
    {/if}
  </div>
  <nav>
    {#each navItems as item}
      <a href={item.href} class="nav-item" class:active={page.url.pathname === item.href}
        >{item.label}</a
      >
    {/each}
    {#if authState.did}
      <button type="button" class="nav-item" onclick={handleLogout}>sair</button>
    {/if}
  </nav>
</div>

<style>
  .identity-bar {
    background: var(--sage);
    color: var(--ink-on-sage);
    padding: 8px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    font-family: var(--m-mono);
    font-size: 12px;
  }
  .handle {
    font-weight: 700;
  }
  .sep {
    color: var(--ochre-deep);
    margin: 0 2px;
  }
  nav {
    display: flex;
    gap: 4px;
  }
  .nav-item {
    font-family: var(--m-mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-decoration: none;
    color: var(--ink-on-sage);
    padding: 6px 12px;
    cursor: pointer;
  }
  .nav-item.active {
    background: var(--ground);
    color: var(--sage);
  }
</style>
