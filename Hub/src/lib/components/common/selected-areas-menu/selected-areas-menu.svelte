<script lang="ts">
	import { selectedAreasStore } from '$lib/stores/selected-areas-store.svelte';
	import { toast } from 'svelte-sonner';

	$effect(() => {
		if (!selectedAreasStore.lastAddedArea) {
			return;
		}

		const invokeToastAsync = async () => {
			if (selectedAreasStore.lastAddedArea === null) {
				return;
			}

			const names = await selectedAreasStore.getAreaNamesById([
				selectedAreasStore.lastAddedArea.id
			]);
			toast.success(`Area added: ${names?.[0]}`);
		};

		invokeToastAsync();
	});

	$effect(() => {
		if (!selectedAreasStore.lastRemovedArea) {
			return;
		}

		const invokeToastAsync = async () => {
			if (selectedAreasStore.lastRemovedArea === null) {
				return;
			}

			const names = await selectedAreasStore.getAreaNamesById([
				selectedAreasStore.lastRemovedArea.id
			]);
			toast.success(`Area removed: ${names?.[0]}`);
		};

		invokeToastAsync();
	});
</script>

<style>
</style>
