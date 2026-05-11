<script lang="ts">
	import { browser } from '$app/environment';
	import { MediaQuery } from 'svelte/reactivity';
	import { UprnServiceApp } from '$lib/index';
	import type { PageData } from './$types';

	import * as Card from '$lib/Components/shadcn/card/index.js';
	import * as Alert from '$lib/Components/shadcn/alert/index.js';

	import MonitorSmartphone from '@lucide/svelte/icons/monitor-smartphone';
	import Laptop from '@lucide/svelte/icons/laptop';

	const mobile = browser ? new MediaQuery('(max-width: 500px)') : null;
	let { data }: { data: PageData } = $props();
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
	<UprnServiceApp config={data.uprnAppConfig} />
{/if}
