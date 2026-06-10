<script lang="ts">
	import { browser } from '$app/environment';
	import { loadArcgis, type AppsUprnConfig } from '@dsh/uprn-service';
	import { MediaQuery } from 'svelte/reactivity';
	import { onMount, type Component } from 'svelte';
	import type { PageData } from './$types';

	import * as Card from '$lib/components/shadcn/card/index.js';
	import * as Alert from '$lib/components/shadcn/alert/index.js';
	import Spinner from '$lib/components/shadcn/spinner/spinner.svelte';

	import MonitorSmartphone from '@lucide/svelte/icons/monitor-smartphone';
	import Laptop from '@lucide/svelte/icons/laptop';

	const mobile = browser ? new MediaQuery('(max-width: 500px)') : null;
	let { data }: { data: PageData } = $props();
	let UprnServiceApp: Component<{ config: AppsUprnConfig }> | null = $state(null);
	let arcgisLoadError: string | null = $state(null);

	onMount(async () => {
		try {
			await loadArcgis();
			UprnServiceApp = (await import('@dsh/uprn-service')).UprnServiceApp;
		} catch (error) {
			console.error('[hub/uprn] Failed to preload ArcGIS before mounting UPRN app', error);
			arcgisLoadError = error instanceof Error ? error.message : String(error);
		}
	});
</script>

{#if mobile?.current}
	<div class="min-h-screen bg-muted/30 flex items-center justify-center p-6">
		<Card.Root class="w-full max-w-md shadow-lg">
			<Card.Header class="space-y-4 text-center">
				<div
					class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-background"
				>
					<MonitorSmartphone class="size-7 text-muted-foreground" />
				</div>

				<div class="space-y-1">
					<Card.Title class="text-2xl">Screen too small</Card.Title>
					<Card.Description>A larger screen is required to use this application.</Card.Description>
				</div>
			</Card.Header>

			<Card.Content>
				<Alert.Root>
					<Laptop class="size-4" />
					<Alert.Description>
						For the best experience, open this application on a device with a larger screen.
					</Alert.Description>
				</Alert.Root>
			</Card.Content>
		</Card.Root>
	</div>
{:else if arcgisLoadError}
	<div class="flex min-h-screen items-center justify-center bg-muted/30 p-6">
		<Card.Root class="w-full max-w-md shadow-lg">
			<Card.Header class="space-y-2 text-center">
				<Card.Title>Map failed to load</Card.Title>
				<Card.Description>{arcgisLoadError}</Card.Description>
			</Card.Header>
		</Card.Root>
	</div>
{:else if UprnServiceApp}
	{@const config = data.uprnAppConfig}
	<UprnServiceApp config={data.uprnAppConfig} defaultSourceIndex={1} />
{:else}
	<div class="flex min-h-screen items-center justify-center bg-muted/30">
		<Spinner class="h-10 w-10" />
	</div>
{/if}
