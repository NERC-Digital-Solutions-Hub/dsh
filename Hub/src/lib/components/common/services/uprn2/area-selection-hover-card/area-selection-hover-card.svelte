<script lang="ts">
	import { areaSelectionStore } from '$lib/stores/services/uprn2/area-selection-store.svelte';
	import * as Card from '$lib/components/ui/card/index.js';

	let currentHoveredAreaName = $state<string | null>(null);
	let mousePosition = $state<{ x: number; y: number }>({ x: 0, y: 0 });
	let hoverRequestVersion = 0;

	// Track mouse position
	const handleMouseMove = (event: MouseEvent) => {
		mousePosition = {
			x: event.clientX,
			y: event.clientY
		};
	};

	// Add mouse move listener when component mounts
	$effect(() => {
		document.addEventListener('mousemove', handleMouseMove);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
		};
	});

	$effect(() => {
		const areaId = areaSelectionStore.currentHoveredArea?.id;
		const myVersion = ++hoverRequestVersion;

		if (!areaId) {
			currentHoveredAreaName = null;
			return;
		}

		(async () => {
			const names = await areaSelectionStore.getAreaNamesById([areaId]);
			if (myVersion !== hoverRequestVersion) return;

			if (areaSelectionStore.currentHoveredArea?.id !== areaId) {
				return;
			}

			currentHoveredAreaName = names[0] ?? null;
		})();
	});
</script>

{#if currentHoveredAreaName}
	<div
		class="pointer-events-none fixed z-50 transition-opacity duration-200"
		style="left: {mousePosition.x + 10}px; top: {mousePosition.y - 10}px;"
	>
		<Card.Root class="max-w-xs border !py-2 shadow-lg">
			<Card.Content class="!px-3 !py-0">
				<p class="text-sm font-medium">{currentHoveredAreaName}</p>
			</Card.Content>
		</Card.Root>
	</div>
{/if}

<style>
</style>
