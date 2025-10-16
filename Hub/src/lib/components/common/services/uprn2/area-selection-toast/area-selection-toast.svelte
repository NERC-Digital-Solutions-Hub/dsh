<script lang="ts">
	import { areaSelectionStore } from '$lib/stores/services/uprn2/area-selection-store.svelte';
	import { toast } from 'svelte-sonner';

	/**
	 * Displays a toast notification for area selection changes.
	 * @param areaId - The ID of the area that was added or removed.
	 * @param action - The action performed ('added' or 'removed').
	 */
	async function showAreaChangeToast(areaId: number, action: 'added' | 'removed') {
		const names = await areaSelectionStore.getAreaNamesById([areaId]);

		if (!names || names.length === 0 || !names[0]) {
			return;
		}

		const message = `Area ${action}: ${names[0]}`;
		toast.success(message);
	}

	// Effect to show toast when an area is added
	$effect(() => {
		if (!areaSelectionStore.lastAddedArea) {
			return;
		}

		showAreaChangeToast(areaSelectionStore.lastAddedArea.id, 'added');
	});

	// Effect to show toast when an area is removed
	$effect(() => {
		if (!areaSelectionStore.lastRemovedArea) {
			return;
		}

		showAreaChangeToast(areaSelectionStore.lastRemovedArea.id, 'removed');
	});
</script>

<style>
</style>
