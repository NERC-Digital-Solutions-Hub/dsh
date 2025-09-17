<script lang="ts">
	import * as TreeView from '$lib/components/ui/tree-view/index.js';
	import Node from './arcgis-tree-view-node.svelte';

	type TreeNode = {
		id: string;
		name: string;
		layer?: __esri.Layer | __esri.Sublayer;
		children?: TreeNode[];
	};

	type Props = { webMap?: __esri.WebMap | null };
	const { webMap = null }: Props = $props();

	let layerTree: TreeNode[] = $state<TreeNode[]>([]);

	$effect(() => {
		const wm = webMap; // only dependency
		if (!wm) {
			layerTree = [];
			return;
		}

		let cancelled = false;

		(async () => {
			await wm.when();
			const tree = await buildTreeFromMap(wm);
			if (!cancelled) layerTree = tree;
		})();

		return () => {
			cancelled = true;
		};
	});

	async function buildTreeFromMap(map: __esri.Map): Promise<TreeNode[]> {
		await Promise.all(map.layers.map((layer) => layer.load?.().catch(() => {})));

		const nodes: TreeNode[] = [];
		for (const layer of map.layers.toArray()) {
			nodes.push(await layerToNode(layer));
		}
		return nodes;
	}

	async function layerToNode(layer: __esri.Layer): Promise<TreeNode> {
		const base: TreeNode = {
			id: layer.uid,
			name: layer.title as string,
			layer: layer,
			children: []
		};

		if (layer.type === 'group') {
			const g = layer as __esri.GroupLayer;
			await Promise.all(g.layers.map((c) => c.load?.().catch(() => {})));
			base.children = await Promise.all(g.layers.toArray().map((c) => layerToNode(c)));
			return base;
		}

		// MapImageLayer / WMSLayer -> dive into .sublayers (which can be nested)
		if (layer.type === 'map-image' || layer.type === 'wms') {
			const hasSublayers =
				(layer as __esri.MapImageLayer | __esri.WMSLayer).sublayers &&
				(layer as any).sublayers.length > 0;
			if (hasSublayers) {
				base.children = await sublayerCollectionToNodes(
					(layer as __esri.MapImageLayer | __esri.WMSLayer)
						.sublayers as __esri.Collection<__esri.Sublayer>
				);
			}
			return base;
		}

		return base;
	}

	async function sublayerCollectionToNodes(
		sublayers: __esri.Collection<__esri.Sublayer>
	): Promise<TreeNode[]> {
		await Promise.all(sublayers.map((subLayer) => subLayer.load?.().catch(() => {})));

		const nodes: TreeNode[] = [];
		for (const subLayer of sublayers.toArray()) {
			nodes.push(await sublayerToNode(subLayer));
		}
		return nodes;
	}

	async function sublayerToNode(subLayer: __esri.Sublayer): Promise<TreeNode> {
		const node: TreeNode = {
			id: subLayer.uid,
			name: subLayer.title as string,
			layer: subLayer,
			children: []
		};

		if (subLayer.sublayers && subLayer.sublayers.length) {
			node.children = await sublayerCollectionToNodes(subLayer.sublayers);
		}
		return node;
	}
</script>

<TreeView.Root>
	{#each layerTree as node (node.id)}
		<Node {node} showVisibility={false} onNodeClick={(n) => console.log('clicked', n)} />
	{/each}
</TreeView.Root>

<style>
</style>
