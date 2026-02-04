<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import NavBar from '$lib/components/nav-bar/nav-bar.svelte';

	const siteName = 'Digital Solutions Hub';
	let { children } = $props();
</script>

<svelte:head>
	<title>
		{page.data?.title ? `${page.data.title} | ${siteName}` : siteName}
	</title>

	{#if page.data?.description}
		<meta name="description" content={page.data.description} />
	{/if}
</svelte:head>

<main class="main-content">
	<NavBar />
	{@render children?.()}
</main>

<style>
	.main-content {
		height: 100dvh;
		display: flex;
		flex-direction: column;
	}
</style>
