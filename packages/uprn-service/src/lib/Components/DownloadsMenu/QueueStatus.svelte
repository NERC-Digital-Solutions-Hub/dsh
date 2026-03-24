<script lang="ts">
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';
	import { ChevronsUp, ChevronsDown } from '@lucide/svelte';

	type Props = {
		queueId: number;
		queuePosition: number;
	};

	let { queueId, queuePosition }: Props = $props();

	/**
	 * Generates tooltip content based on the queue ID and position.
	 * @param queueId - The ID of the queue (1 for low priority, 2 for high priority).
	 * @param queuePosition - The position of the item in the queue.
	 * @returns A string containing the tooltip content.
	 */
	function getTooltipContent(queueId: number, queuePosition: number): string {
		if (queueId === 1) {
			return `Queue position: ${queuePosition} (Low Priority)`;
		} else if (queueId === 2) {
			return `Queue position: ${queuePosition} (High Priority)`;
		}

		throw new Error(`Invalid queueId: ${queueId}. Expected 1 or 2.`);
	}
</script>

<Tooltip.Provider disableHoverableContent>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<div class="inline-flex items-center rounded-md px-1 py-1 border-gray-100 border-1">
				{#if queueId === 1}
					<span class="text-xs text-muted-foreground">{queuePosition}</span>
					<ChevronsDown class="w-4 h-4 text-muted-foreground" />
				{:else if queueId === 2}
					<span class="text-xs text-muted-foreground">{queuePosition}</span>
					<ChevronsUp class="w-4 h-4 text-muted-foreground" />
				{/if}
			</div>
		</Tooltip.Trigger>
		<Tooltip.Content>
			{getTooltipContent(queueId, queuePosition)}
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
