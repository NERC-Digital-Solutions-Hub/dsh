<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { toast } from 'svelte-sonner';
	import { areaSelectionStore } from '$lib/stores/area-selection-store.svelte';
	import { dataSelectionStore } from '$lib/stores/data-selection-store.svelte';

	let canExport = $derived(
		areaSelectionStore.layerHighlightState.areaInfos.length > 0 &&
			dataSelectionStore.DataSelections.size > 0
	);

	function handleExportClick() {
		if (areaSelectionStore.layerHighlightState.areaInfos.length <= 0) {
			toast.error('Please select at least one area to export.');
			return;
		}

		if (dataSelectionStore.DataSelections.size <= 0) {
			toast.error('Please select at least one data layer to export.');
			return;
		}

		console.log('Starting export...');

		toast.info('Export started successfully.', {
			duration: 4000
		});
	}
</script>

<p class="text-sm text-muted-foreground">Click "Export" to begin the download.</p>
<Button onclick={handleExportClick}>Export</Button>

<style>
</style>
