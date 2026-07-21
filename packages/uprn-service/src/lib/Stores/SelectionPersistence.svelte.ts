import { SelectionState } from '$lib/Models/Treeview/SelectionState';
import type { INodeProvider } from '$lib/Services/INodeProvider';
import type { NodeSelectionController } from '$lib/Services/NodeSelectionController';
import type { NodeVisibilityController } from '$lib/Services/NodeVisibilityController.svelte';
import {
	selectionRepository,
	type SelectionRepository
} from '$lib/Persistence/SelectionRepository';
import type { AreaSelectionStore } from './AreaSelectionStore.svelte';
import type { DataSelectionStore } from './DataSelectionStore.svelte';
import { SvelteSet } from 'svelte/reactivity';

type SelectionPersistenceOptions = {
	getPersistenceKey: () => string | null;
	getVisibilityInitialized: () => boolean;
	areaSelectionStore: AreaSelectionStore;
	dataSelectionStore: DataSelectionStore;
	nodeProvider: INodeProvider;
	visibilityController: NodeVisibilityController;
	selectionController: NodeSelectionController;
	repository?: SelectionRepository;
};

/** Hydrates and persists area/data selections for the active web-map source. */
export function createSelectionPersistence(options: SelectionPersistenceOptions) {
	const repository = options.repository ?? selectionRepository;
	let initialized = $state(false);
	let loadGeneration = 0;
	let loadedSelection = $state<Awaited<ReturnType<SelectionRepository['get']>> | null>(null);

	$effect(() => {
		const persistenceKey = options.getPersistenceKey();
		const generation = ++loadGeneration;
		initialized = false;
		loadedSelection = null;
		if (!persistenceKey) return;

		void repository.get(persistenceKey).then((selection) => {
			if (generation === loadGeneration) loadedSelection = selection;
		});
	});

	$effect(() => {
		if (initialized || !options.getVisibilityInitialized() || !loadedSelection) return;

		const selections = loadedSelection;
		if (selections.areas) {
			options.areaSelectionStore.setAreaSelectionLayer(selections.areas.nodeId);
			options.areaSelectionStore.addSelectedAreas([...selections.areas.areaIds]);
			if (selections.areas.nodeId) {
				const node = options.nodeProvider.getTreeviewNode(selections.areas.nodeId);
				if (node) options.visibilityController.setVisibilityState(node, true);
			}
		}

		for (const dataSelection of selections.data) {
			options.dataSelectionStore.addSelection(dataSelection);
			if (dataSelection.selectedFieldIds.size === 0) {
				const node = options.nodeProvider.getTreeviewNode(dataSelection.nodeId);
				if (node) options.selectionController.setSelectionState(node, SelectionState.Active);
			}

			for (const fieldId of dataSelection.selectedFieldIds) {
				const node = options.nodeProvider.getTreeviewNode(`${dataSelection.nodeId}-${fieldId}`);
				if (node) options.selectionController.setSelectionState(node, SelectionState.Active);
			}
		}

		initialized = true;
	});

	$effect(() => {
		const persistenceKey = options.getPersistenceKey();
		if (!persistenceKey || !initialized) return;

		const areas = options.areaSelectionStore.exportSnapshot();
		void repository.update(persistenceKey, { areas: areas.nodeId ? areas : null });
	});

	$effect(() => {
		const persistenceKey = options.getPersistenceKey();
		if (!persistenceKey || !initialized) return;

		const data = options.dataSelectionStore.getAllSelections().map((selection) => ({
			nodeId: selection.nodeId,
			selectedFieldIds: new SvelteSet(selection.selectedFieldIds)
		}));
		void repository.update(persistenceKey, { data });
	});

	return {
		get initialized() {
			return initialized;
		},
		reset(): void {
			loadGeneration += 1;
			initialized = false;
			loadedSelection = null;
		}
	};
}
