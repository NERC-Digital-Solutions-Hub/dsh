<!-- FilterButton.svelte -->
<script lang="ts">
	import { InfoIcon } from '@lucide/svelte';
	import { getItemInfoDialogEvents } from '$lib/Events/ItemInfoDialogEvents';
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';

	/**
	 * Props for the InfoButton component.
	 */
	type Props = {
		/** The ID of the layer this button controls. */
		layerId: string;
	};

	const { layerId }: Props = $props();

	const { onOpenInfoDialog } = getItemInfoDialogEvents();

	/**
	 * Handles click events on the info button.
	 * Stops event propagation and calls the callback.
	 * @param event - The mouse event.
	 */
	function handleClick(event: MouseEvent) {
		event.stopPropagation();
		onOpenInfoDialog?.(layerId);
	}
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<button class="info-button" onclick={handleClick} aria-label="Additional information">
				<InfoIcon class="size-4" />
			</button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Additional information</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>

<style>
	.info-button {
		/* Layout */
		display: inline-flex;
		line-height: 1;
		vertical-align: middle;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;

		/* Appearance */
		background: transparent;
		border: none;
		border-radius: 0rem;
		cursor: pointer;

		/* Transitions */
		transition: background-color 0.1s ease-out;

		/* Focus */
		outline: none;
	}

	/* Interactive states for inactive button */
	.info-button :global(svg path),
	.info-button :global(svg circle) {
		stroke: #d1d5db; /* Also set stroke for stroke-based icons */
		transition:
			fill 0.1s ease-out,
			opacity 0.1s ease-out;
	}

	/* Interactive states for inactive button */
	.info-button:not(.active):hover {
		background-color: hsl(var(--muted));
	}

	.info-button:not(.active):hover :global(svg path),
	.info-button:not(.active):hover :global(svg circle) {
		stroke: #9ca3af; /* Medium gray on hover */
	}

	.info-button:not(.active):focus {
		background-color: hsl(var(--muted));
	}

	/* Active state */
	.info-button:active :global(svg path),
	.info-button:active :global(svg cirlce) {
		stroke: hsl(var(--primary));
		opacity: 1; /* Full opacity when active */
	}
</style>
