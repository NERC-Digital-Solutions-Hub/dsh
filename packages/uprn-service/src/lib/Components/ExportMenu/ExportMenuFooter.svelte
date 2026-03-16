<script lang="ts">
	import ClearSelectionsButton from '$lib/Components/ClearSelectionsButton/ClearSelectionsButton.svelte';
	import Button from '$lib/Components/shadcn/button/button.svelte';
	import Card from '$lib/Components/shadcn/card/card.svelte';
	import Spinner from '$lib/Components/shadcn/spinner/spinner.svelte';
	import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
	import type { AreaSelectionInteractionStore } from '$lib/Stores/AreaSelectionInteractionStore.svelte';
	import { DataSelectionStore } from '$lib/Stores/DataSelectionStore.svelte';
	import type DownloadsStore from '$lib/Stores/DownloadsStore.svelte';
	import { TreeviewNodeLayerType } from '$lib/Types/Treeview.types';
	import { Check, TriangleAlert } from '@lucide/svelte';
	import {
		DownloadStatus,
		type AreaFieldInfoWithCode,
		type AreaSelectionInfoWithCode,
		type DataSelectionInfo
	} from '$lib/Types/Uprn.types';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';
	import { AreaSelectionStore } from '$lib/Stores/AreaSelectionStore.svelte';

	type Props = {
		onExportSuccess?: () => void;
		areaSelectionInteractionStore: AreaSelectionInteractionStore;
		areaSelectionStore: AreaSelectionStore;
		dataSelectionStore: DataSelectionStore;
		downloadsStore: DownloadsStore;
		nodeConfigProvider: INodeConfigProvider;
		areaSelectionLimits: Map<string, number>;
	};

	const {
		onExportSuccess,
		areaSelectionInteractionStore,
		areaSelectionStore,
		dataSelectionStore,
		downloadsStore,
		nodeConfigProvider,
		areaSelectionLimits
	}: Props = $props();

	const areRequirementsMet = $derived.by(() => {
		return (
			areaSelectionInteractionStore.selectionViewState?.areaHandles.size > 0 &&
			dataSelectionStore.getAllSelections().length > 0 &&
			!exceedsAreaSelectionLimits()
		);
	});

	let coolingDown: boolean = $state(false);
	let cooldownTimer: ReturnType<typeof setTimeout> | null = null;

	const cooldownDuration = 1000; // 1 second cooldown

	onDestroy(() => {
		if (cooldownTimer) {
			clearTimeout(cooldownTimer);
		}
	});

	/**
	 * Checks if the current area selection exceeds the defined limits for export.
	 * @returns True if the selection exceeds limits, false otherwise.
	 */
	function exceedsAreaSelectionLimits(): boolean {
		if (!areaSelectionStore.layerId) {
			return false;
		}

		const limit = areaSelectionLimits.get(areaSelectionStore.layerId);
		if (limit === undefined) {
			return false;
		}

		return areaSelectionStore.areaIds.size > limit;
	}

	// TODO: Add onExport function prop to handle export completion externally

	/**
	 * Handles the export button click event.
	 * Validates that areas and data are selected, then initiates the export process.
	 */
	function handleExportClick() {
		if (areaSelectionInteractionStore.selectionViewState?.areaHandles.size <= 0) {
			toast.error('Please select at least one area to export.');
			return;
		}

		if (dataSelectionStore.getAllSelections().length <= 0) {
			toast.error('Please select at least one data layer to export.');
			return;
		}

		coolingDown = true;
		cooldownTimer = setTimeout(() => (coolingDown = false), cooldownDuration);

		console.log('Starting export...');

		const addDownload = async () => {
			const areaFieldCodes: string[] = await areaSelectionInteractionStore.getAreaCodesById(
				areaSelectionInteractionStore.selectionViewState.areaHandles.keys().toArray()
			);

			const areaFieldInfos: AreaFieldInfoWithCode[] =
				areaSelectionInteractionStore.selectionViewState.areaHandles
					.entries()
					.map(([area, _], index) => {
						return {
							id: area,
							code: areaFieldCodes[index]
						};
					})
					.toArray();

			const areaSelection: AreaSelectionInfoWithCode = {
				layerId: areaSelectionInteractionStore.selectionViewState.layerView?.layer.id || '',
				areaFieldInfos: areaFieldInfos
			};

			const dataSelections: DataSelectionInfo[] = dataSelectionStore
				.getAllSelections()
				.flatMap((selection) => {
					const config = nodeConfigProvider.getConfig(selection.nodeId);
					if (!config) {
						return [];
					}

					if (config.type === TreeviewNodeLayerType.MapImageLayer) {
						// Expand each field into its own synthetic layer selection
						return Array.from(selection.selectedFieldIds).map((fieldId) => ({
							nodeId: `${selection.nodeId}-${fieldId}`,
							selectedFieldIds: new Set([fieldId])
						}));
					}

					if (config.type === TreeviewNodeLayerType.TileLayer) {
						// Expand each field into its own synthetic layer selection
						return Array.from(selection.selectedFieldIds).map((fieldId) => ({
							nodeId: `${selection.nodeId}-${fieldId}`,
							selectedFieldIds: new Set([fieldId])
						}));
					}

					// Keep all other selections unchanged
					return [selection];
				})
				.map((selection) => ({
					layerId: selection.nodeId,
					fields: Array.from(selection.selectedFieldIds)
				}));

			const localId = crypto.randomUUID();
			downloadsStore.addDownload({
				localId: localId,
				status: DownloadStatus.Pending,
				areaSelection,
				dataSelections
			});

			onExportSuccess?.();
		};

		addDownload();
	}
</script>

<Card class="m-1 p-2 py-1 shadow-none">
	<div class="flex w-full items-center justify-between gap-3">
		<div class="flex min-w-0 items-center gap-2">
			{#if !areRequirementsMet}
				<TriangleAlert class="h-4 w-4 shrink-0 text-amber-600" />
			{:else}
				<Check class="h-4 w-4 shrink-0 text-green-600" />
			{/if}

			{#if areaSelectionStore.layerId && exceedsAreaSelectionLimits()}
				{@const limit = areaSelectionLimits.get(areaSelectionStore.layerId)}
				<p class="text-sm text-muted-foreground">
					The current area selection exceeds the maximum allowed for export. The limit for the
					selected area layer is {limit} areas.
				</p>
			{:else if areaSelectionInteractionStore.selectionViewState?.areaHandles.size === 0}
				<p class="text-sm text-muted-foreground">Please select at least one area to export.</p>
			{:else if dataSelectionStore.getAllSelections().length === 0}
				<p class="text-sm text-muted-foreground">Please select at least one dataset to export.</p>
			{:else}
				<p class="text-sm text-muted-foreground">Click 'Export' to begin the download.</p>
			{/if}
		</div>

		<Tooltip.Provider disableHoverableContent>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant={areRequirementsMet ? 'default' : 'outline'}
						disabled={coolingDown || !areRequirementsMet}
						onclick={handleExportClick}
						class="shrink-0"
					>
						{#if coolingDown}
							<Spinner />
						{:else}
							Export
						{/if}
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content side="top">
					{#if areaSelectionStore.layerId && exceedsAreaSelectionLimits()}
						{@const limit = areaSelectionLimits.get(areaSelectionStore.layerId)}
						The current area selection exceeds the maximum allowed for export. The limit for the selected
						area layer is {limit} areas.
					{:else if areaSelectionInteractionStore.selectionViewState?.areaHandles.size === 0}
						Please select at least one area to export.
					{:else if dataSelectionStore.getAllSelections().length === 0}
						Please select at least one dataset to export.
					{:else if coolingDown}
						Please wait a moment before starting another export.
					{:else}
						Export the selected areas and datasets.
					{/if}
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	</div>
</Card>
