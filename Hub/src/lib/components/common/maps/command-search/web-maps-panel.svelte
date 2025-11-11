<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as ScrollArea from '$lib/components/ui/scroll-area/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import type UseFetchWebMaps from '$lib/hooks/use-fetch-web-maps.svelte';

	type Props = {
		hook: UseFetchWebMaps;
		title?: string;
		description?: string;
	};

	const {
		hook,
		title = 'Available web maps',
		description = 'Run the command to load the available web maps.'
	}: Props = $props();

	type PortalItem = __esri.PortalItem;

	const maps = $derived.by(() => {
		const results = hook.response?.results as PortalItem[] | undefined;
		return results ? [...results].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '')) : [];
	});

	const hasData = $derived.by(() => maps.length > 0);
</script>

<Card.Root class="space-y-4 border shadow-sm">
	<Card.Header>
		<Card.Title>{title}</Card.Title>
		<Card.Description>
			{#if hook.isLoading}
				Fetching the latest catalogue entries.
			{:else if hasData}
				Showing {maps.length} web maps.
			{:else}
				{description}
			{/if}
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-4">
		{#if hook.error}
			<Alert.Root variant="destructive">
				<Alert.Title>Unable to fetch web maps</Alert.Title>
				<Alert.Description>{hook.error.message}</Alert.Description>
			</Alert.Root>
		{:else if hook.isLoading}
			<div class="flex items-center justify-center py-10">
				<Spinner class="size-6 text-primary" />
			</div>
		{:else if hasData}
			<ScrollArea.Root class="max-h-80 pr-4">
				<div class="space-y-3">
					{#each maps as map (map.id)}
						<article class="rounded-lg border bg-card p-3 text-sm shadow-sm">
							<header class="flex items-start justify-between gap-2">
								<h3 class="leading-tight font-medium">{map.title ?? 'Untitled web map'}</h3>
								{#if typeof map.numViews === 'number'}
									<span class="text-xs text-muted-foreground">{map.numViews} views</span>
								{/if}
							</header>
							{#if map.snippet}
								<p class="text-sm text-muted-foreground">{map.snippet}</p>
							{:else if map.description}
								<p class="line-clamp-3 text-sm text-muted-foreground">{map.description}</p>
							{/if}
							<footer class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
								{#if map.owner}
									<span>Owner: {map.owner}</span>
								{/if}
								{#if Array.isArray(map.tags) && map.tags.length}
									<span>Tags: {map.tags.slice(0, 3).join(', ')}</span>
								{/if}
							</footer>
						</article>
					{/each}
				</div>
			</ScrollArea.Root>
		{:else}
			<p class="text-sm text-muted-foreground">
				No web maps available yet. Try running the command again.
			</p>
		{/if}
	</Card.Content>
</Card.Root>

<style>
	:global(.line-clamp-3) {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		overflow: hidden;
	}
</style>
