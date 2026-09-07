<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { authState, logout } from '$lib/atproto.svelte';
	import { goto } from '$app/navigation';

	let { children } = $props();

	async function handleLogout() {
		await logout();
		goto('/');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav>
	<a href="/">micelio</a>
	<a href="/new">New event</a>
	<a href="/moderation">Moderation</a>
	{#if authState.did}
		<button onclick={handleLogout}>Log out</button>
	{:else}
		<a href="/login">Log in</a>
	{/if}
</nav>

{@render children()}
