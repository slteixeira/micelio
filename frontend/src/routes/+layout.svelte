<script lang="ts">
	import '$lib/styles/tokens.css';
	import favicon from '$lib/assets/favicon.svg';
	import IdentityBar from '$lib/components/IdentityBar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="page">
	<IdentityBar />
	{@render children()}
</div>
