<script lang="ts">
	import { areaSelectionStore } from '$lib/stores/area-selection-store.svelte';
	import { toast } from 'svelte-sonner';

	$effect(() => {
		if (!areaSelectionStore.lastAddedArea) {
			return;
		}

		const invokeToastAsync = async () => {
			if (areaSelectionStore.lastAddedArea === null) {
				return;
			}

			const names = await areaSelectionStore.getAreaNamesById([
				areaSelectionStore.lastAddedArea.id
			]);
			toast.success(`Area added: ${names?.[0]}`);
		};

		invokeToastAsync();
	});

	$effect(() => {
		if (!areaSelectionStore.lastRemovedArea) {
			return;
		}

		const invokeToastAsync = async () => {
			if (areaSelectionStore.lastRemovedArea === null) {
				return;
			}

			const names = await areaSelectionStore.getAreaNamesById([
				areaSelectionStore.lastRemovedArea.id
			]);
			toast.success(`Area removed: ${names?.[0]}`);
		};

		invokeToastAsync();
	});
</script>

<style>
</style>
