<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import { areaSelectionStore } from '$lib/stores/services/uprn2/area-selection-store.svelte';
	import { dataSelectionStore } from '$lib/stores/services/uprn2/data-selection-store.svelte';
	import { downloadsStore } from '$lib/stores/services/uprn2/downloads-store.svelte';
	import { toast } from 'svelte-sonner';

	type Props = {
		onExportSuccess?: () => void;
	};

	const { onExportSuccess }: Props = $props();

	/**
	 * Handles the export button click event.
	 * Validates that areas and data are selected, then initiates the export process.
	 */
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

		const downloadId = crypto.randomUUID();
		downloadsStore.downloads.push({
			id: downloadId,
			url: `${$page.url}/${downloadId}`,
			status: 'pending'
		});

		onExportSuccess?.();
	}
</script>

<p class="text-sm text-muted-foreground">Click "Export" to begin the download.</p>
<Button onclick={handleExportClick}>Export</Button>

<style>
</style>
