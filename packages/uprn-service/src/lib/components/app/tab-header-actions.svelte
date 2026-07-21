<script lang="ts">
	import DebugDialog from '$lib/components/debug-dialog/debug-dialog.svelte';
	import ResetDialog, { type ResetAction } from '$lib/components/reset-dialog/reset-dialog.svelte';
	import Button from '$lib/components/shadcn/button/button.svelte';
	import * as Tooltip from '$lib/components/shadcn/tooltip/index.js';
	import type { WebMapSourceConfig } from '$lib/types/configuration.types';
	import { InfoIcon } from '@lucide/svelte';

	type Props = {
		resetOpen: boolean;
		resetActions: ResetAction[];
		sources: WebMapSourceConfig[];
		selectedSourceIndex: number;
		onOpenIntroduction: () => void;
	};

	let {
		resetOpen = $bindable(false),
		resetActions,
		sources,
		selectedSourceIndex = $bindable(0),
		onOpenIntroduction
	}: Props = $props();
</script>

<ResetDialog
	bind:open={resetOpen}
	actions={resetActions}
	buttonClass="size-8 p-0 shadow-none hover:bg-transparent focus:ring-0 focus:outline-none"
>
	<DebugDialog class="size-5" {sources} bind:selectedIndex={selectedSourceIndex} />
</ResetDialog>

<Tooltip.Provider disableHoverableContent>
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					class="size-8 p-0 shadow-none hover:bg-transparent focus:ring-0 focus:outline-none"
					variant="outline"
					aria-label="Information"
					onclick={onOpenIntroduction}
				>
					<InfoIcon class="size-4" aria-hidden="true" />
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="bottom"><p>Information</p></Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
