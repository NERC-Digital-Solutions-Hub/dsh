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

<div class="export-footer">
	<div class="export-footer__left">
		<p class="text-sm text-muted-foreground">Click "Export" to begin the download.</p>
	</div>

	<div class="export-footer__right">
		<Button onclick={handleExportClick}>Export</Button>
	</div>
</div>

<style>
	.export-footer {
		border-top: 1px solid rgba(0, 0, 0, 0.2);
		display: grid;
		grid-template-columns: 1fr 1fr; /* two equal columns */
		gap: 0.5rem;
		align-items: center; /* vertically center content in each column */
		width: 100%;
	}

	.export-footer__left,
	.export-footer__right {
		display: flex;
		align-items: center; /* vertical center */
		min-height: 48px; /* ensure a reasonable hit area */
	}

	/* Left column: horizontally center its content within the left half */
	.export-footer__left {
		justify-content: center;
		text-align: center;
	}

	/* Right column: keep the button at the right edge and vertically centered */
	.export-footer__right {
		justify-content: flex-end;
	}

	/* Reset paragraph default margins so centering is exact */
	.export-footer__left p {
		margin: 0;
	}

	/* Responsive: stack columns on small screens and center both */
	@media (max-width: 480px) {
		.export-footer {
			grid-template-columns: 1fr;
			gap: 0.25rem;
		}

		.export-footer__right {
			justify-content: center;
		}
	}
</style>
