<!-- DownloadButton.svelte -->
<script lang="ts">
	import DownloadCheckbox from '$lib/Components/DownloadCheckbox/DownloadCheckbox.svelte';
	import { SelectionState, type TreeviewNode } from '$lib/Models/Treeview/Index.js';
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';

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

	/**
	 * Handles click events on the download button.
	 * Toggles between active and inactive states.
	 * @param event - The mouse event.
	 */
	function handleClick(event: MouseEvent) {
		event.stopPropagation();
		const newState =
			externalState === SelectionState.Active ? SelectionState.Inactive : SelectionState.Active;

		onDownloadStateChanged?.(node, newState);
	}
</script>

<Tooltip.Provider disableHoverableContent>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<DownloadCheckbox
				checked={isChecked}
				indeterminate={isIndeterminate}
				onclick={handleClick}
				aria-label={getTooltipContent(externalState)}
			/>
		</Tooltip.Trigger>
		<Tooltip.Content side="right">
			<p>{getTooltipContent(externalState)}</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
