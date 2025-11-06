import type { AreaSelectionStore } from '$lib/stores/services/uprn2/area-selection-store.svelte';
import type {
	DataSelectionSnapshot,
	DataSelectionStore
} from '$lib/stores/services/uprn2/data-selection-store.svelte';
import { getSelection, updateSelection } from '$lib/db';
import { SvelteMap } from 'svelte/reactivity';

/**
 * Store for tracking UPRN selection changes and persisting them to the database.
 */
export class SelectionTrackingStore {
	#areaSelectionStore: AreaSelectionStore;
	#dataSelectionStore: DataSelectionStore;

	#initialLoadComplete = $state(false);

	#areaLayerSnapshot = $derived.by(() => this.#areaSelectionStore.exportSnapshot());
	#dataSelectionSnapshots = $derived.by(() => {
		// Create a deep snapshot to track changes to nested SvelteSet objects
		const snapshots = new SvelteMap<string, DataSelectionSnapshot>();
		for (const [layerId, snapshot] of this.#dataSelectionStore.dataSelections) {
			snapshots.set(layerId, {
				layerId: snapshot.layerId,
				// Access the SvelteSet to create a reactive dependency
				selectedFieldIds: snapshot.selectedFieldIds
			});
		}
		return snapshots;
	});

	/**
	 * Initializes the SelectionTrackingStore instance.
	 * @param areaSelectionStore The area selection store containing selected areas.
	 * @param dataSelectionStore The data selection store containing selected data layers and their fields.
	 */
	constructor(areaSelectionStore: AreaSelectionStore, dataSelectionStore: DataSelectionStore) {
		this.#areaSelectionStore = areaSelectionStore;
		this.#dataSelectionStore = dataSelectionStore;

		$effect.root(() => {
			$effect(() => {
				console.log('[selection-tracking-store] Detected area selection change');
				const async = async () => {
					if (!this.#initialLoadComplete) {
						console.log(
							'[selection-tracking-store] Initial load not complete, skipping area selection effect'
						);
						return;
					}

					if (!this.#areaLayerSnapshot) {
						return;
					}

					if (!this.#areaLayerSnapshot.layerId) {
						await updateSelection({ areas: null });
						return;
					}

					if (!this.#areaLayerSnapshot.selectedAreaIds.size) {
						await updateSelection({ areas: null });
						return;
					}

					await updateSelection({ areas: this.#areaLayerSnapshot });

					console.log(
						'[selection-tracking-store] Area selection updated:',
						$state.snapshot(this.#areaLayerSnapshot)
					);
				};

				async();
			});

			$effect(() => {
				console.log('[selection-tracking-store] Detected data selection change');
				const async = async () => {
					if (!this.#initialLoadComplete) {
						console.log(
							'[selection-tracking-store] Initial load not complete, skipping data selection effect'
						);
						return;
					}

					if (!this.#dataSelectionSnapshots || this.#dataSelectionSnapshots.size === 0) {
						console.log('[selection-tracking-store] No data selections, clearing in database');
						await updateSelection({ data: [] });
						return;
					}

					await updateSelection({ data: this.#dataSelectionSnapshots.values().toArray() });

					console.log(
						'[selection-tracking-store] Data selection updated:',
						$state.snapshot(this.#dataSelectionSnapshots)
					);
				};

				async();
			});
		});
	}

	/**
	 * Loads existing selections from the database into the stores.
	 */
	async loadSelections() {
		const selection = await getSelection();
		if (!selection) {
			console.log('[selection-tracking-store] No existing selection found in database');
			this.#initialLoadComplete = true;
			return;
		}

		console.log('[selection-tracking-store] Loaded selection from database:', selection);

		if (selection.areas) {
			this.#areaSelectionStore.setLayerId(selection.areas.layerId);

			console.log(
				'[selection-tracking-store] (loadSelections) Restoring selected area IDs:',
				Array.from(selection.areas.selectedAreaIds),
				'layer ID:',
				this.#areaSelectionStore.layerId
			);
			this.#areaSelectionStore.addSelectedAreas(Array.from(selection.areas.selectedAreaIds));
		}

		selection.data.forEach((dataSelection) => {
			this.#dataSelectionStore.addSelection(dataSelection);
		});

		this.#initialLoadComplete = true;
	}
}
