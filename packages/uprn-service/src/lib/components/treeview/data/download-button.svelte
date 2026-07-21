<!-- DownloadButton.svelte -->
<script lang="ts">
	import DownloadCheckbox from '$lib/components/download-checkbox/download-checkbox.svelte';
	import { SelectionState, type TreeviewNode } from '$lib/models/treeview/index.js';
	import * as Tooltip from '$lib/components/shadcn/tooltip/index.js';

	/**
	 * Props for the DownloadButton component.
	 */
	type Props = {
		/** The tree node this button controls. */
		node: TreeviewNode;
		/** Callback when download state changes. */
		onDownloadStateChanged?: (node: TreeviewNode, downloadState: SelectionState) => void;
		/** Function to get current download state. */
		getDownloadState?: (node: TreeviewNode) => SelectionState;
	};

	/** Destructured props. */
	const { node, onDownloadStateChanged, getDownloadState }: Props = $props();

	/** Derived state for whether the checkbox is checked. */
	let externalState = $derived(getDownloadState?.(node) ?? SelectionState.Inactive);
	let isChecked = $derived(externalState === SelectionState.Active);
	let isIndeterminate = $derived(externalState === SelectionState.Indeterminate);

	/**
	 * Returns the tooltip content based on the current selection state.
	 * @param state - The current selection state of the node.
	 */
	function getTooltipContent(state: SelectionState): string {
		switch (state) {
			case SelectionState.Active:
				return 'Remove from download';
			case SelectionState.Inactive:
				return 'Add to download';
			case SelectionState.Indeterminate:
				return 'Partially selected for download';
			default:
				return '';
		}
	}

	function handleClick(event: MouseEvent): void {
		event.stopPropagation();
	}

	function handleCheckedChange(checked: boolean): void {
		onDownloadStateChanged?.(node, checked ? SelectionState.Active : SelectionState.Inactive);
	}
</script>

<Tooltip.Provider disableHoverableContent>
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<DownloadCheckbox
					{...props}
					checked={isChecked}
					indeterminate={isIndeterminate}
					onclick={handleClick}
					onCheckedChange={handleCheckedChange}
					aria-label={getTooltipContent(externalState)}
				/>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="right">
			<p>{getTooltipContent(externalState)}</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
