<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import type { PageData } from './$types';
	import type { Component } from 'svelte';
	import type { AppsUprnConfig } from '@dsh/uprn-service';

	import * as Card from '$lib/components/shadcn/card/index.js';
	import * as Alert from '$lib/components/shadcn/alert/index.js';

	import MonitorSmartphone from '@lucide/svelte/icons/monitor-smartphone';
	import Laptop from '@lucide/svelte/icons/laptop';

	const mobile = browser ? new MediaQuery('(max-width: 500px)') : null;
	let { data }: { data: PageData } = $props();
	let UprnServiceApp: Component<{ config: AppsUprnConfig }> | null = $state(null);

	onMount(async () => {
		UprnServiceApp = (await import('@dsh/uprn-service')).UprnServiceApp;
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
{:else}
	{#if UprnServiceApp}
		<UprnServiceApp config={data.uprnAppConfig} />
	{/if}
{/if}
