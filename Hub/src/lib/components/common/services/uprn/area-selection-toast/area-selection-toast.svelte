<script lang="ts">
	import { areaSelectionStore } from '$lib/stores/services/uprn/area-selection-store.svelte';
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

			if (!names || names.length === 0 || !names[0]) {
				return;
			}

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

			if (!names || names.length === 0 || !names[0]) {
				return;
			}

			toast.success(`Area removed: ${names?.[0]}`);
		};

		invokeToastAsync();
	});
</script>

<style>
</style>
