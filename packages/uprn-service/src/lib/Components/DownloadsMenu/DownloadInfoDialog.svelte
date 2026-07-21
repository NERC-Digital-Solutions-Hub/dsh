<script lang="ts">
	import * as Dialog from '$lib/Components/shadcn/dialog/index.js';
	import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
	import ScrollArea from '$lib/Components/shadcn/scroll-area/scroll-area.svelte';
	import type { TreeviewNode } from '$lib/Models/Treeview/TreeviewNode';
	import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
	import type { INodeProvider } from '$lib/Services/INodeProvider';
	import {
		TreeviewNodeTypology,
		type TreeviewNodeConfig,
		type TreeviewNodeTypology as TreeviewNodeTypologyType
	} from '$lib/Types/Treeview.types.js';
	import type { DownloadDisplayInfoNode, DownloadEntry } from '$lib/Types/Uprn.types';
	import type { SelectionSummaryNode } from '$lib/Types/SelectionSummary.types';
	import SelectionSummarySection from '$lib/Components/SelectionSummary/SelectionSummarySection.svelte';
	import { SvelteMap } from 'svelte/reactivity';

	type Props = {
		nodeProvider: INodeProvider;
		nodeConfigProvider: INodeConfigProvider;
		isOpen: boolean;
		download: DownloadEntry | null;
	};

	type SelectionTreeviewNodeTypeWithParent = SelectionSummaryNode & {
		parentId?: string;
	};

	let { nodeProvider, nodeConfigProvider, isOpen = $bindable(), download }: Props = $props();

	const displayInfo = $derived.by(() => download?.displayInfo ?? null);

	function mapTypology(typology?: string): TreeviewNodeTypologyType | undefined {
		if (!typology) return undefined;

		switch (typology) {
			case TreeviewNodeTypology.Area:
			case TreeviewNodeTypology.Folder:
			case TreeviewNodeTypology.DatasetRaster:
			case TreeviewNodeTypology.DatasetVector:
			case TreeviewNodeTypology.Variable:
				return typology as TreeviewNodeTypologyType;
			default:
				return undefined;
		}
	}

	function createSelectionNodeFromDisplayInfo(node: DownloadDisplayInfoNode): SelectionSummaryNode {
		return {
			id: node.id,
			name: node.name,
			isVariable: node.isVariable,
			isLeaf: node.children.length === 0,
			children: node.children.map(createSelectionNodeFromDisplayInfo),
			typology: mapTypology(node.typology)
		};
	}

	function collectAreaNamesFromDisplayTree(
		nodes: DownloadDisplayInfoNode[] | undefined,
		result: Map<string, string> = new SvelteMap<string, string>()
	): Map<string, string> {
		if (!nodes) return result;

		for (const node of nodes) {
			if (node.children.length === 0) {
				result.set(String(node.id), node.name);
				continue;
			}

			collectAreaNamesFromDisplayTree(node.children, result);
		}

		return result;
	}

	let areaSelectionTree: SelectionSummaryNode[] = $derived.by(() => {
		if (!download) return [];

		if (displayInfo?.areaTree?.length) {
			return displayInfo.areaTree.map(createSelectionNodeFromDisplayInfo);
		}

		if (!download.areaSelection.areaFieldInfos.length) {
			return [];
		}

		const layerId = download.areaSelection.layerId;
		const layerConfig = nodeConfigProvider.getConfig(layerId);
		const layerTitle = layerConfig?.displayName || layerConfig?.name || layerId || 'Selected Areas';
		const areaNameById = collectAreaNamesFromDisplayTree(displayInfo?.areaTree);

		const childNodes: SelectionSummaryNode[] = download.areaSelection.areaFieldInfos.map(
			(area) => ({
				id: String(area.id),
				name: areaNameById.get(String(area.id)) || area.code || `Area ${area.id}`,
				isVariable: false,
				isLeaf: true,
				children: [],
				typology: TreeviewNodeTypology.Variable
			})
		);

		return [
			{
				id: `area-layer-${layerId}`,
				name: layerTitle,
				isVariable: false,
				isLeaf: false,
				children: childNodes,
				typology: layerConfig?.typology || TreeviewNodeTypology.Area
			}
		];
	});

	let dataSelectionTree: SelectionSummaryNode[] = $derived.by(() => {
		if (!download) return [];

		if (displayInfo?.dataTree?.length) {
			return displayInfo.dataTree.map(createSelectionNodeFromDisplayInfo);
		}

		if (download.dataSelections.length === 0) {
			return [];
		}

		const nodeMap = new SvelteMap<string, SelectionTreeviewNodeTypeWithParent>();

		const ensureNode = (node: TreeviewNode): SelectionTreeviewNodeTypeWithParent | null => {
			const existing = nodeMap.get(node.id);
			if (existing) return existing;

			const nodeConfig: TreeviewNodeConfig | undefined = nodeConfigProvider.getConfig(node.id);
			if (!nodeConfig) return null;

			const created: SelectionTreeviewNodeTypeWithParent = {
				id: node.id,
				name: nodeConfig.displayName || nodeConfig.name || node.id,
				isVariable: node.type === TreeviewNodeType.Variable,
				isLeaf: true,
				children: [],
				typology: nodeConfig.typology || TreeviewNodeTypology.Variable,
				parentId: node.parent?.id
			};

			nodeMap.set(node.id, created);
			return created;
		};

		const ensureFallbackNode = (
			nodeId: string,
			parentId: string | undefined,
			isVariable: boolean
		): SelectionTreeviewNodeTypeWithParent => {
			const existing = nodeMap.get(nodeId);
			if (existing) return existing;

			const nodeConfig: TreeviewNodeConfig | undefined = nodeConfigProvider.getConfig(nodeId);
			const created: SelectionTreeviewNodeTypeWithParent = {
				id: nodeId,
				name: nodeConfig?.displayName || nodeConfig?.name || nodeId,
				isVariable,
				isLeaf: true,
				children: [],
				typology:
					nodeConfig?.typology ||
					(isVariable ? TreeviewNodeTypology.Variable : TreeviewNodeTypology.Folder),
				parentId
			};

			nodeMap.set(nodeId, created);
			return created;
		};

		const ensureAncestors = (start: TreeviewNode | undefined) => {
			let current = start;
			while (current) {
				const ensured = ensureNode(current);
				if (!ensured) break;
				current = current.parent?.id ? nodeProvider.getTreeviewNode(current.parent.id) : undefined;
			}
		};

		for (const selection of download.dataSelections) {
			const base = nodeProvider.getTreeviewNode(selection.layerId);
			if (base) {
				ensureAncestors(base);
			} else {
				ensureFallbackNode(selection.layerId, undefined, false);
			}

			for (const variableName of selection.fields) {
				const variableId = `${selection.layerId}-${variableName}`;
				const variableNode = nodeProvider.getTreeviewNode(variableId);
				if (variableNode) {
					ensureAncestors(variableNode);
					continue;
				}

				ensureFallbackNode(variableId, selection.layerId, true);
			}
		}

		const rootNodes: SelectionSummaryNode[] = [];

		for (const node of nodeMap.values()) {
			if (!node.parentId) {
				rootNodes.push(node);
				continue;
			}

			const parentNode = nodeMap.get(node.parentId);
			if (parentNode) {
				parentNode.children.push(node);
				parentNode.isLeaf = false;
			} else {
				rootNodes.push(node);
			}
		}

		for (const node of nodeMap.values()) {
			node.isLeaf = node.children.length === 0;
		}

		return rootNodes;
	});

	const title = $derived.by(() => {
		if (download?.externalId) {
			return `Download Details`;
		}
		return 'Download Details';
	});
</script>

<Dialog.Root bind:open={isOpen} onOpenChange={(open) => (isOpen = open)}>
	<Dialog.Content class="download-info-dialog max-h-[70vh] min-w-[400px] max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			{#if download?.externalId}
				<Dialog.Description class="break-all font-mono text-xs">
					{download.externalId}
				</Dialog.Description>
			{/if}
		</Dialog.Header>

		{#if !download}
			<p class="text-center text-sm italic text-muted-foreground">No download selected.</p>
		{:else}
			<ScrollArea class="max-h-[50vh] w-full pr-4">
				<div class="flex flex-col gap-6">
					<SelectionSummarySection
						kind="area"
						title="Areas"
						nodes={areaSelectionTree}
						emptyText="No areas in this download."
					/>

					<SelectionSummarySection
						kind="data"
						title="Data Selections"
						nodes={dataSelectionTree}
						emptyText="No data selections in this download."
					/>
				</div>
			</ScrollArea>
		{/if}
	</Dialog.Content>
</Dialog.Root>
