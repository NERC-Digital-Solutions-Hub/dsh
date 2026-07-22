<script lang="ts">
	import VisibilityCheckbox from '$lib/components/visibility-checkbox/visibility-checkbox.svelte';
	import { NodeDrawState } from '$lib/models/treeview/index.js';

	/**
	 * Visibility checkbox and suspended-state label used by area and data tree rows.
	 */
	type Props = {
		checked: boolean;
		disabled?: boolean;
		drawState?: NodeDrawState;
		onCheckedChange?: () => void;
		visible?: boolean;
	};

	const { checked, disabled = false, drawState, onCheckedChange, visible = true }: Props = $props();
</script>

<span class="action-slot visibility-wrapper" class:visible>
	<span class="visibility-inner">
		<VisibilityCheckbox
			{checked}
			{disabled}
			indeterminate={drawState === NodeDrawState.Suspended}
			{onCheckedChange}
		/>
	</span>
	{#if drawState === NodeDrawState.Suspended}
		<span class="indeterminate-label">zoom</span>
	{/if}
</span>
