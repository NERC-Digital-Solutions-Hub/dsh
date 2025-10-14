<!-- DownloadButton.svelte -->
<script lang="ts">
	import DownloadCheckbox from '$lib/components/ui/checkbox/download-checkbox.svelte';
	import { DownloadState, type TreeNode } from '../types.js';

	type Props = {
		node: TreeNode;
		onDownloadStateChanged?: (node: TreeNode, downloadState: DownloadState) => void;
		getDownloadState?: (node: TreeNode) => DownloadState;
	};

	const { node, onDownloadStateChanged, getDownloadState }: Props = $props();

	let externalState = $derived(getDownloadState?.(node) ?? DownloadState.Inactive);
	let isChecked = $derived(externalState === DownloadState.Active);
	let isIndeterminate = $derived(externalState === DownloadState.Indeterminate);

	function handleClick(event: MouseEvent) {
		event.stopPropagation();
		const newState =
			externalState === DownloadState.Active ? DownloadState.Inactive : DownloadState.Active;

		onDownloadStateChanged?.(node, newState);
	}
</script>

<div>
	<DownloadCheckbox checked={isChecked} indeterminate={isIndeterminate} onclick={handleClick} />
</div>
