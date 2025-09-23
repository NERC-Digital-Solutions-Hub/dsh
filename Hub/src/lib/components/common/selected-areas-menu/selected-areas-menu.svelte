<script lang="ts">
	import { selectedAreasStore } from '$lib/stores/selected-areas-store.svelte';
	import { toast } from 'svelte-sonner';

	$effect(() => {
		if (!selectedAreasStore.lastAddedHandle) {
			return;
		}

		const invokeToastAsync = async () => {
			if (selectedAreasStore.lastAddedHandle === null) {
				return;
			}

			const names = await selectedAreasStore.getAreaNamesById([
				selectedAreasStore.lastAddedHandle.id
			]);
			toast.success(`Area added: ${names?.[0]}`);
		};

		invokeToastAsync();
	});

	$effect(() => {
		if (!selectedAreasStore.lastRemovedHandle) {
			return;
		}

		const invokeToastAsync = async () => {
			if (selectedAreasStore.lastRemovedHandle === null) {
				return;
			}

			const names = await selectedAreasStore.getAreaNamesById([
				selectedAreasStore.lastRemovedHandle.id
			]);
			toast.success(`Area removed: ${names?.[0]}`);
		};

		invokeToastAsync();
	});
</script>

<style>
</style>
