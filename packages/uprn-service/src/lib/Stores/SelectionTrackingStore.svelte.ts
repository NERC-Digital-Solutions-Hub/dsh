import type { AreaSelectionStore } from '$lib/Stores/AreaSelectionStore.svelte';
import type {
	DataSelectionSnapshot,
	DataSelectionStore
} from '$lib/Stores/DataSelectionStore.svelte';
import { getSelection, updateSelection } from '$lib/db';
import { SvelteMap } from 'svelte/reactivity';

/**
 * Store for tracking UPRN selection changes and persisting them to the database.
 */
export class SelectionTrackingStore {
	readonly #portalItemId: string;
	readonly #areaSelectionStore: AreaSelectionStore;
	readonly #dataSelectionStore: DataSelectionStore;

	#areaLayerSnapshot = $derived.by(() => this.#areaSelectionStore.exportSnapshot());
	#dataSelectionSnapshots = $derived.by(() => {
		// Create a deep snapshot to track changes to nested SvelteSet objects
		const snapshots = new SvelteMap<string, DataSelectionSnapshot>();
		for (const [layerId, snapshot] of this.#dataSelectionStore.dataSelections) {
			snapshots.set(layerId, {
				nodeId: snapshot.nodeId,
				// Access the SvelteSet to create a reactive dependency
				selectedFieldIds: snapshot.selectedFieldIds
			});
		}
		return snapshots;
	});

	/**
	 * Initializes the SelectionTrackingStore instance.
	 * @param portalItemId The initial portal item ID to load selections for.
	 * @param dataSelectionStore The data selection store containing selected data layers and their fields.
	 * @param areaSelectionStore The area selection store containing selected areas.
	 */
	constructor(
		portalItemId: string,
		dataSelectionStore: DataSelectionStore,
		areaSelectionStore: AreaSelectionStore
	) {
		console.log('[selection-tracking-store] Initializing with portalItemId:', portalItemId);
		this.#portalItemId = portalItemId;
		this.#dataSelectionStore = dataSelectionStore;
		this.#areaSelectionStore = areaSelectionStore;
		this.loadSelections(portalItemId);

		$effect.root(() => {
			/**
			 * Effect 2: area selection changes for the current portal item
			 */
			$effect(() => {
				const portalItemId = this.#portalItemId;
				console.log('[selection-tracking-store] Detected area selection change');
				if (!this.#areaLayerSnapshot) {
					return;
				}

				const async = async () => {
					if (!portalItemId) {
						console.log(
							'[selection-tracking-store] No portalItemId, skipping area selection persistence'
						);
						return;
					}

					if (!this.#areaLayerSnapshot) {
						return;
					}

					if (!this.#areaLayerSnapshot.nodeId) {
						await updateSelection(portalItemId, { areas: null });
						return;
					}

					if (!this.#areaLayerSnapshot.areaIds.size) {
						await updateSelection(portalItemId, { areas: null });
						return;
					}

					await updateSelection(portalItemId, { areas: this.#areaLayerSnapshot });

					console.log(
						'[selection-tracking-store] Area selection updated:',
						$state.snapshot(this.#areaLayerSnapshot),
						'for portalItemId:',
						portalItemId
					);
				};

				async();
			});

			/**
			 * Effect 3: data selection changes for the current portal item
			 */
			$effect(() => {
				const portalItemId = this.#portalItemId;
				console.log('[selection-tracking-store] Detected data selection change');

				const async = async () => {
					if (!portalItemId) {
						console.log(
							'[selection-tracking-store] No portalItemId, skipping data selection persistence'
						);
						return;
					}

					if (!this.#dataSelectionSnapshots || this.#dataSelectionSnapshots.size === 0) {
						console.log(
							'[selection-tracking-store] No data selections, clearing in database for',
							portalItemId
						);
						await updateSelection(portalItemId, { data: [] });
						return;
					}

					await updateSelection(portalItemId, {
						data: this.#dataSelectionSnapshots.values().toArray()
					});

					console.log(
						'[selection-tracking-store] Data selection updated:',
						$state.snapshot(this.#dataSelectionSnapshots),
						'for portalItemId:',
						portalItemId
					);
				};

				async();
			});
		});
	}

	/**
	 * Loads existing selections for a given portal item from the database into the stores.
	 */
	public async loadSelections(portalItemId: string) {
		console.log('[selection-tracking-store] Loading selections for portalItemId:', portalItemId);
		const selection = await getSelection(portalItemId);

		console.log(
			'[selection-tracking-store] Loaded selection from database for',
			portalItemId,
			':',
			selection
		);

		if (selection.areas) {
			this.#areaSelectionStore.setAreaSelectionLayer(selection.areas.nodeId);

			console.log(
				'[selection-tracking-store] (loadSelections) Restoring selected area IDs:',
				Array.from(selection.areas.areaIds),
				'layer ID:',
				this.#areaSelectionStore.layerId
			);

			this.#areaSelectionStore.addSelectedAreas(Array.from(selection.areas.areaIds));
		}

		selection.data.forEach((dataSelection) => {
			this.#dataSelectionStore.addSelection(dataSelection);
		});
	}
}
