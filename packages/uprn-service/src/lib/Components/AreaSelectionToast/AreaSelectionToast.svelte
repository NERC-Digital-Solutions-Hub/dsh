<script lang="ts">
	import type { AreaSelectionInteractionStore } from '$lib/Stores/AreaSelectionInteractionStore.svelte';
	import { toast } from 'svelte-sonner';
	import { Plus, Minus } from '@lucide/svelte';

	type Props = {
		areaSelectionInteractionStore: AreaSelectionInteractionStore;
	};

	const { areaSelectionInteractionStore }: Props = $props();
	const areaSelectionToastId = 'area-selection-toast';
	const areaSelectionToastDuration = 4000;
	let latestToastRequest = 0;

	/**
	 * Displays a toast notification for area selection changes.
	 * @param areaId - The ID of the area that was added or removed.
	 * @param action - The action performed ('added' or 'removed').
	 */
	async function showAreaChangeToast(areaId: number, action: 'added' | 'removed') {
		const requestId = ++latestToastRequest;
		const names = await areaSelectionInteractionStore.getAreaNamesById([areaId]);

		if (requestId !== latestToastRequest) {
			return;
		}

		if (!names || names.length === 0 || !names[0]) {
			return;
		}

		const message = `Area ${action}: ${names[0]}`;
		toast.success(message, {
			id: areaSelectionToastId,
			duration: areaSelectionToastDuration,
			icon: action === 'added' ? Plus : Minus,
			class: 'custom-toast'
		});
	}

	// Effect to show toast when an area is added
	$effect(() => {
		if (!areaSelectionInteractionStore.lastAddedArea) {
			return;
		}

		showAreaChangeToast(areaSelectionInteractionStore.lastAddedArea.id, 'added');
	});

	// Effect to show toast when an area is removed
	$effect(() => {
		if (!areaSelectionInteractionStore.lastRemovedArea) {
			return;
		}

		showAreaChangeToast(areaSelectionInteractionStore.lastRemovedArea.id, 'removed');
	});
</script>

<style>
	:global(.custom-toast) {
		pointer-events: none;
	}
</style>
