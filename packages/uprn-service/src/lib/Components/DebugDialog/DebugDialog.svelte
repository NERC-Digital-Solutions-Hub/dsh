<!--
	DebugDialog
	A developer-only panel, opened from a bug icon, for switching the active web
	map source at runtime. Renders the configured sources as radio buttons and
	writes the chosen index back via the `selectedIndex` binding so the parent can
	rebuild the web map.

	Styling ownership: the parent controls outer placement; this component only
	owns its trigger button and dialog internals. Pass `class` to style the
	trigger button.
-->
<script lang="ts">
	import { buttonVariants } from '$lib/Components/shadcn/button/index.js';
	import * as Dialog from '$lib/Components/shadcn/dialog/index.js';
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';
	import { RadioGroup, RadioGroupItem } from '$lib/Components/shadcn/radio-group/index.js';
	import type { WebMapSourceConfig } from '$lib/Types/Configuration.types';
	import { cn } from '$lib/utils';
	import { Bug } from '@lucide/svelte';

	type Props = {
		/** The available web map sources to choose between. */
		sources: WebMapSourceConfig[];
		/** The index of the currently selected source. Two-way bound. */
		selectedIndex?: number;
		/** Optional class for the trigger button. */
		class?: string;
	};

	let { sources, selectedIndex = $bindable(0), class: className }: Props = $props();

	// RadioGroup works with string values; mirror the selected index as a string.
	let selectedValue = $derived(String(selectedIndex));

	function onValueChange(value: string): void {
		selectedIndex = Number(value);
	}
</script>

<Dialog.Root>
	<Tooltip.Provider disableHoverableContent>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props: tooltipProps })}
					<Dialog.Trigger
						{...tooltipProps}
						class={cn(buttonVariants({ variant: 'outline' }), className)}
						aria-label="Debug options"
					>
						<Bug aria-hidden="true" />
					</Dialog.Trigger>
				{/snippet}
			</Tooltip.Trigger>

			<Tooltip.Content side="bottom">
				<p>Debug options</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Debug Options</Dialog.Title>
			<Dialog.Description>Switch the active web map source.</Dialog.Description>
		</Dialog.Header>
		<RadioGroup value={selectedValue} {onValueChange} class="py-2">
			{#each sources as source, index (source.name)}
				<label class="flex items-center gap-3 text-sm text-foreground">
					<RadioGroupItem value={String(index)} />
					<span>{source.name}</span>
				</label>
			{/each}
		</RadioGroup>
	</Dialog.Content>
</Dialog.Root>
