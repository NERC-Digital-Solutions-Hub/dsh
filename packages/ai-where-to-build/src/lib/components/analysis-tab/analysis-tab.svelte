<script lang="ts">
	import Button from '$lib/components/shadcn/button/button.svelte';
	import { addGraphicLayer } from '$lib/services/add-graphic-layer';
	import { AnalyserServiceV1 } from '$lib/services/analysis/analyser-service-v1';
	import { AnalyserServiceV2 } from '$lib/services/analysis/analyser-service-v2';
	import { LayerViewProvider } from '$lib/services/layer-view-provider';
	import { AreaSelectionInteractionStore } from '$lib/stores/area-selection-interaction-store.svelte';
	import { AreaSelectionStore } from '$lib/stores/area-selection-store.svelte';
	import { MapInteractionStore } from '$lib/stores/map-interaction-store.svelte';
	import { onMount } from 'svelte';

	type Props = {
		mapView: __esri.MapView;
	};

	const { mapView }: Props = $props();

	let areaSelectionStore: AreaSelectionStore | null = $state(null);
	let areaSelectionInteractionStore: AreaSelectionInteractionStore | null = $state(null);
	let mapInteractionStore: MapInteractionStore | null = $state(null);
	let graphicLayer: __esri.GraphicsLayer | null = $state(null);
	let analyserServiceV1: AnalyserServiceV1 | null = $state(null);
	let analyserServiceV2: AnalyserServiceV2 | null = $state(null);

	const DEFAULT_WARD_LAYER_TITLE = 'UK Wards (Boundary Fully Clipped) (2022)';

	onMount(async () => {
		graphicLayer = await addGraphicLayer(mapView, 'Analysis Results Layer');
		analyserServiceV1 = new AnalyserServiceV1({ mapView, graphicLayer });
		analyserServiceV2 = new AnalyserServiceV2({ mapView, graphicLayer });
		await initializeStores();
		setDefaultAreaLayer();
	});

	async function initializeStores() {
		if (!mapView) {
			throw new Error('[analysis-tab] MapView is not initialized');
		}

		areaSelectionStore = new AreaSelectionStore();
		areaSelectionInteractionStore = new AreaSelectionInteractionStore(
			areaSelectionStore,
			new LayerViewProvider(mapView)
		);

		mapInteractionStore = new MapInteractionStore(
			mapView,
			areaSelectionInteractionStore,
			new Set([DEFAULT_WARD_LAYER_TITLE])
		);

		console.log('[analysis-tab] Initialized stores', areaSelectionStore.layerId);

		await areaSelectionInteractionStore.refreshLayerView();
		await areaSelectionInteractionStore.refreshAreas();
	}

	function setDefaultAreaLayer() {
		if (!areaSelectionStore) {
			console.warn('[analysis-tab] AreaSelectionStore not initialized yet');
			return;
		}

		const layer = mapView.map?.allLayers.find((layer) => layer.title === DEFAULT_WARD_LAYER_TITLE);

		if (layer) {
			areaSelectionStore.setLayerId(layer.uid);
			console.log(`[analysis-tab] Set default area layer to ID: ${layer.uid}`);
		} else {
			console.warn('[analysis-tab] Default area layer not found on the map');
		}
	}

	function validateComponentsReady(): boolean {
		if (!mapView || !mapView.map) {
			console.warn('[analysis-tab] MapView not initialized yet');
			return false;
		}

		if (!areaSelectionStore || !areaSelectionInteractionStore || !mapInteractionStore) {
			console.warn('[analysis-tab] Stores not initialized yet');
			return false;
		}

		if (!graphicLayer || !analyserServiceV1 || !analyserServiceV2) {
			console.warn('[analysis-tab] Analysis services not initialized yet');
			return false;
		}

		return true;
	}

	async function onAnalyze() {
		if (!validateComponentsReady() || !analyserServiceV2) {
			return;
		}

		const completed = await analyserServiceV2.analyse(getSelectionObjectIds());
		if (completed) {
			await clearAreaSelection();
		}
	}

	async function onProfile() {
		if (!validateComponentsReady() || !analyserServiceV1) {
			return;
		}

		const completed = await analyserServiceV1.analyse(getSelectionObjectIds());
		if (completed) {
			await clearAreaSelection();
		}
	}

	async function clearAreaSelection() {
		areaSelectionStore?.clearSelectedAreas();
		await areaSelectionInteractionStore?.refreshAreas();
		areaSelectionInteractionStore?.clearSelections();
	}

	function getSelectionObjectIds(): number[] {
		if (!areaSelectionInteractionStore || !areaSelectionStore) {
			return [];
		}

		return Array.from(areaSelectionStore.selectedAreaIds);
	}
</script>

<div class="analysis-container">
	<div class="header-section">
		<p class="description">
			This is the Analysis tab. This is where the user can initiate analysis for a polygon or area
			(e.g. Ward).
		</p>
	</div>

	<div class="button-group">
		<Button onclick={onAnalyze}>Analyze</Button>
		<Button onclick={onProfile}>Profile</Button>
	</div>
</div>

<style>
	.analysis-container {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}

	.header-section {
		padding: 1rem;
		background-color: #f9fafb;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
	}

	.description {
		margin: 0;
		color: #374151;
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.button-group {
		display: flex;
		flex-direction: row;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: auto;
		padding-top: 1.5rem;
	}
</style>
