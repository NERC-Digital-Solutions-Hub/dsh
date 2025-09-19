<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';
	import * as Menubar from '$lib/components/ui/menubar/index.js';

	type Props = {
		webMap?: __esri.WebMap | null;
		selectionLayers?: string[];
		onLayerSelected?: (layer: __esri.Layer) => void;
	};

	type LayerItem = {
		label: string;
		layer: __esri.Layer;
	};

	interface GroupLayerItem extends LayerItem {
		children: LayerItem[];
	}

	const { webMap = null, selectionLayers = [], onLayerSelected = () => {} }: Props = $props();

	let items = $state<GroupLayerItem[]>([]);
	let radioSelection = $state<string>('');
	let previousSelection = $state<string>('');

	$effect(() => {
		console.log('webMap changed', webMap);
		if (!webMap) {
			items = [];
			return;
		}

		const groupLayers = getSelectionLayers();
		for (const group of groupLayers) {
			for (const layer of group.layers) {
				layer.visible = false;
			}
		}

		items = groupLayers.map((group) => ({
			label: group.title as string,
			layer: group,
			children:
				(group.layers?.toArray() || []).map((layer) => ({
					label: layer.title as string,
					layer: layer
				})) || []
		}));
	});

	$effect(() => {
		if (!radioSelection) {
			return;
		}

		if (radioSelection === previousSelection) {
			return; // No change
		}

		onSelectLayer();
		previousSelection = radioSelection;
	});

	function getSelectionLayers(): __esri.GroupLayer[] {
		if (!webMap) {
			return [];
		}

		const groups = webMap.layers.filter(
			(layer): layer is __esri.GroupLayer =>
				layer.type === 'group' && selectionLayers.includes(layer.title as string)
		);

		console.log('Filtered group layers for selection:', groups);

		return groups.toArray();
	}

	function onSelectLayer() {
		if (!radioSelection) {
			return;
		}

		const selectedLayer: __esri.Layer | null = getSelectedLayer(radioSelection);
		if (!selectedLayer) {
			toast.error(`Layer not found: ${radioSelection}`);
			return;
		}

		if (previousSelection) {
			console.log('previousSelection', previousSelection);
			const previousLayer = getSelectedLayer(previousSelection);
			if (previousLayer && previousLayer !== selectedLayer) {
				previousLayer.visible = false;
				const previousParent = previousLayer.parent as __esri.GroupLayer;
				previousParent.visible = false; // Hide parent group if applicable
			}
		}

		toast.success(`'${selectedLayer.title}' Selected`);
		selectedLayer.visible = true;
		const selectedLayerParent = selectedLayer.parent as __esri.GroupLayer;
		selectedLayerParent.visible = true; // Hide parent group if applicable
		onLayerSelected(selectedLayer);
	}

	function getSelectedLayer(label: string): __esri.Layer | null {
		for (const group of items) {
			for (const layer of group.children) {
				if (layer.label === label) {
					return layer.layer;
				}
			}
		}
		return null;
	}
</script>

<Toaster />

<Menubar.Root>
	{#each items as item}
		<Menubar.Menu>
			<Menubar.Trigger>{item.label}</Menubar.Trigger>
			<Menubar.Content>
				<Menubar.RadioGroup bind:value={radioSelection}>
					{#each item.children as child}
						<Menubar.RadioItem value={child.label}>{child.label}</Menubar.RadioItem>
					{/each}
				</Menubar.RadioGroup>
			</Menubar.Content>
		</Menubar.Menu>
	{/each}
</Menubar.Root>

<style>
</style>
