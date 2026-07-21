import { NodeDrawState } from '$lib/Models/Treeview/index';
import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
import type { LayerViewProvider } from '$lib/Services/LayerViewProvider';
import { arcgisImport } from '@dsh/common/arcgis';
import type {
	INodeVisibilityRenderer,
	NodeVisibilityDependencyChange,
	NodeVisibilityRenderChange,
	NodeVisibilityRenderTarget
} from '$lib/Services/INodeVisibilityRenderer';

/**
 * ArcGIS implementation of the renderer-neutral node visibility bridge.
 */
export class ArcgisNodeVisibilityRenderer implements INodeVisibilityRenderer {
	readonly #layerViewProvider: LayerViewProvider;
	readonly #drawStateHandles: Map<string, IHandle> = new Map();

	constructor(layerViewProvider: LayerViewProvider) {
		this.#layerViewProvider = layerViewProvider;
	}

	public async applyVisibility(change: NodeVisibilityRenderChange): Promise<void> {
		if (change.target.kind === 'source') {
			await this.applyLayerVisibility(change);
			return;
		}

		await this.applyLayerMemberVisibility(change);
	}

	public async applyDependencyVisibility(change: NodeVisibilityDependencyChange): Promise<void> {
		const layer: __esri.Layer | undefined = this.#layerViewProvider.getLayerById(
			change.target.sourceId
		);
		if (!layer) {
			await this.handleDependentLayerNotFound(change);
			return;
		}

		if (change.target.kind === 'source-member') {
			const memberLayer = this.getLayerMember(layer, change.target);
			if (!memberLayer) {
				if (this.isParquetLayer(layer)) {
					this.setLayerVisibility(layer, change.isVisible);
					await this.syncParentLayerViewVisibility(layer);
					return;
				}

				await this.handleDependentLayerNotFound(change);
				return;
			}

			this.setLayerVisibility(memberLayer, change.isVisible);
			if (this.isParquetLayer(memberLayer as __esri.Layer)) {
				await this.syncParentLayerViewVisibility(memberLayer as __esri.Layer);
			}
			return;
		}

		this.setLayerVisibility(layer, change.isVisible);
		if (this.isParquetLayer(layer)) {
			await this.syncParentLayerViewVisibility(layer);
			return;
		}

		const layerView: __esri.LayerView | undefined = await this.getLayerView(layer);
		if (layerView) {
			layerView.visible = change.isVisible;
		}
	}

	public reset(): void {
		this.#drawStateHandles.forEach((handle) => handle.remove());
		this.#drawStateHandles.clear();
	}

	private async applyLayerVisibility(change: NodeVisibilityRenderChange): Promise<void> {
		const layer: __esri.Layer | undefined = this.#layerViewProvider.getLayerById(
			change.target.sourceId
		);
		if (!layer) {
			console.warn(
				`Layer not found for node ${change.target.nodeId} with source ID ${change.target.sourceId}`
			);
			return;
		}

		this.removeDrawStateHandle(change.target.drawStateNodeId);

		if (!change.isVisible) {
			this.setLayerVisibility(layer, false);
			if (this.isParquetLayer(layer)) {
				await this.syncParentLayerViewVisibility(layer);
			} else {
				const layerView: __esri.LayerView | undefined = await this.getLayerView(layer);
				if (layerView) {
					layerView.visible = false;
				}
			}

			change.setDrawState(undefined);
			return;
		}

		this.setLayerVisibility(layer, true);
		if (this.isParquetLayer(layer)) {
			await this.syncParentLayerViewVisibility(layer);
			change.setDrawState(NodeDrawState.Visible);
			return;
		}

		const layerView: __esri.LayerView | undefined = await this.getLayerView(layer);
		if (!layerView) {
			console.warn(
				`Layer view not found for node ${change.target.nodeId} with source ID ${change.target.sourceId}`
			);
			change.setDrawState(NodeDrawState.Visible);
			return;
		}

		layerView.visible = true;

		const reactiveUtils = await arcgisImport<typeof import('@arcgis/core/core/reactiveUtils.js')>(
			'@arcgis/core/core/reactiveUtils.js'
		);
		const handle: IHandle = reactiveUtils.watch(
			() => layerView.suspended,
			(isSuspended, wasSuspended) => {
				if (wasSuspended && !isSuspended) {
					change.setDrawState(NodeDrawState.Visible);
				} else if (!wasSuspended && isSuspended) {
					change.setDrawState(NodeDrawState.Suspended);
				}
			}
		);

		this.setInitialDrawState(change, layerView);
		this.#drawStateHandles.set(change.target.drawStateNodeId, handle);
	}

	private async applyLayerMemberVisibility(change: NodeVisibilityRenderChange): Promise<void> {
		if (change.target.kind !== 'source-member') {
			return;
		}

		const parentLayer = this.#layerViewProvider.getLayerById(change.target.sourceId);
		if (!parentLayer) {
			console.warn(
				`Layer not found for variable node ${change.sourceNode.id} with parent source ID ${change.target.sourceId}`
			);
			return;
		}

		if (this.isParquetLayer(parentLayer)) {
			this.setLayerVisibility(parentLayer, change.isVisible);
			await this.syncParentLayerViewVisibility(parentLayer);
			change.setDrawState(change.isVisible ? NodeDrawState.Visible : undefined);
			return;
		}

		const memberLayer = this.getLayerMember(parentLayer, change.target);
		if (memberLayer && this.isParquetLayer(memberLayer as __esri.Layer)) {
			this.setLayerVisibility(memberLayer, change.isVisible);
			await this.syncLayerViewVisibility(parentLayer, parentLayer.visible);
			await this.syncParentLayerViewVisibility(parentLayer);
			change.setDrawState(change.isVisible ? NodeDrawState.Visible : undefined);
			return;
		}

		const parentLayerView: __esri.LayerView | undefined = await this.getLayerView(parentLayer);
		if (!parentLayerView) {
			console.warn(
				`Layer view not found for variable node ${change.sourceNode.id} with parent source ID ${change.target.sourceId}`
			);
			return;
		}

		const subLayer = this.getLayerMember(parentLayerView.layer, change.target);
		if (!subLayer) {
			return;
		}

		this.setLayerVisibility(subLayer, change.isVisible);
		parentLayerView.visible = change.isVisible;

		if (!change.isVisible) {
			change.setDrawState(undefined);
			return;
		}

		change.setDrawState(NodeDrawState.Visible);
	}

	private async getLayerView(layer: __esri.Layer): Promise<__esri.LayerView | undefined> {
		try {
			return await this.#layerViewProvider.getLayerView(layer);
		} catch {
			return undefined;
		}
	}

	private isParquetLayer(layer: __esri.Layer): boolean {
		const layerInfo = layer as { type?: string; __uprnParquetLayer?: boolean };
		return layerInfo.type === 'parquet' || layerInfo.__uprnParquetLayer === true;
	}

	private removeDrawStateHandle(drawStateNodeId: string): void {
		this.#drawStateHandles.get(drawStateNodeId)?.remove();
		this.#drawStateHandles.delete(drawStateNodeId);
	}

	private setLayerVisibility(layer: __esri.Layer | __esri.Sublayer, isVisible: boolean): void {
		layer.visible = isVisible;
		this.updateParentLayerVisibility(layer, isVisible);
	}

	private async syncLayerViewVisibility(
		layer: __esri.Layer,
		isVisible: boolean | undefined
	): Promise<void> {
		const layerView: __esri.LayerView | undefined = await this.getLayerView(layer);
		if (layerView) {
			layerView.visible = Boolean(isVisible);
		}
	}

	private async syncParentLayerViewVisibility(
		layer: __esri.Layer | __esri.Sublayer
	): Promise<void> {
		const parent = layer.parent;
		if (!parent || !('visible' in parent) || !('type' in parent)) {
			return;
		}

		await this.syncLayerViewVisibility(parent as __esri.Layer, parent.visible);
		await this.syncParentLayerViewVisibility(parent as __esri.Layer);
	}

	private setInitialDrawState(
		change: NodeVisibilityRenderChange,
		layerView: __esri.LayerView
	): void {
		if (layerView.suspended) {
			change.setDrawState(NodeDrawState.Suspended);
			console.warn(
				`Layer view for node ${change.target.nodeId} is initially suspended, setting draw state to Suspended`
			);
			return;
		}

		change.setDrawState(NodeDrawState.Visible);
	}

	private getSublayer(
		layer: __esri.Layer,
		target: Extract<NodeVisibilityRenderTarget, { kind: 'source-member' }>
	): __esri.Sublayer | undefined {
		const layerIndex = Number(target.memberId);
		return (layer as __esri.MapImageLayer)?.allSublayers?.find(
			(sublayer) => sublayer.id === layerIndex
		);
	}

	private getGroupLayerMember(
		layer: __esri.Layer,
		target: Extract<NodeVisibilityRenderTarget, { kind: 'source-member' }>
	): __esri.Layer | undefined {
		if (layer.type !== 'group') {
			return undefined;
		}

		const memberLayerId = `${target.sourceId}-${target.memberId}`;
		return (layer as __esri.GroupLayer).layers.find(
			(childLayer) => childLayer.id === memberLayerId
		);
	}

	private getLayerMember(
		layer: __esri.Layer,
		target: Extract<NodeVisibilityRenderTarget, { kind: 'source-member' }>
	): __esri.Layer | __esri.Sublayer | undefined {
		return this.getSublayer(layer, target) ?? this.getGroupLayerMember(layer, target);
	}

	private async handleDependentLayerNotFound(
		change: NodeVisibilityDependencyChange
	): Promise<void> {
		if (
			!change.dependentNode.parent ||
			change.dependentNode.parent.type !== TreeviewNodeType.Dataset ||
			change.dependentNode.parent.capabilities.render?.kind !== 'source'
		) {
			console.warn(
				`Layer view not found for dependent node ${change.dependentNode.id} with source ID ${change.target.sourceId} while enforcing visibility dependencies`
			);
			return;
		}

		const parentLayer = this.#layerViewProvider.getLayerById(
			change.dependentNode.parent.capabilities.render.sourceId
		);
		if (!parentLayer) {
			console.warn(
				`Layer not found for parent node ${change.dependentNode.parent.id} with source ID ${change.dependentNode.parent.capabilities.render.sourceId} while enforcing visibility dependencies`
			);
			return;
		}

		if (this.isParquetLayer(parentLayer)) {
			this.setLayerVisibility(parentLayer, change.isVisible);
			return;
		}

		const parentLayerView: __esri.LayerView | undefined = await this.getLayerView(parentLayer);
		if (!parentLayerView) {
			console.warn(
				`Layer view not found for parent node ${change.dependentNode.parent.id} with source ID ${change.dependentNode.parent.capabilities.render.sourceId} while enforcing visibility dependencies`
			);
			return;
		}

		const suffix = change.dependentNode.id.startsWith(`${change.dependentNode.parent.id}-`)
			? change.dependentNode.id.slice(`${change.dependentNode.parent.id}-`.length)
			: undefined;

		const layerIndex = suffix !== undefined && suffix !== '' ? Number(suffix) : 0;
		const subLayer: __esri.Sublayer | undefined = (
			parentLayerView.layer as __esri.MapImageLayer
		)?.allSublayers?.find((sublayer) => sublayer.id === layerIndex);

		if (!subLayer) {
			return;
		}

		subLayer.visible = change.isVisible;
	}

	private parentHasAnyVisibleChild(
		layer: __esri.Layer | __esri.Sublayer | __esri.SubtypeSublayer
	): boolean {
		if (layer.type === 'group') {
			const group = layer as __esri.GroupLayer;
			return group.layers.some((child) => child.visible && this.parentHasAnyVisibleChild(child));
		}

		if (layer.type === 'map-image') {
			const mapImage = layer as __esri.MapImageLayer;
			return (
				mapImage.allSublayers?.some(
					(sublayer) => sublayer.visible && this.parentHasAnyVisibleChild(sublayer)
				) ?? false
			);
		}

		if (layer.type === 'subtype-group') {
			const subtypeGroup = layer as __esri.SubtypeGroupLayer;
			return (
				subtypeGroup.sublayers?.some(
					(sublayer) => sublayer.visible && this.parentHasAnyVisibleChild(sublayer)
				) ?? false
			);
		}

		if ('sublayers' in layer && layer.sublayers?.length) {
			return layer.sublayers.some(
				(sublayer) => sublayer.visible && this.parentHasAnyVisibleChild(sublayer)
			);
		}

		return !('visible' in layer) || layer.visible;
	}

	private updateParentLayerVisibility(
		layer: __esri.Layer | __esri.Sublayer,
		isVisible: boolean
	): void {
		const parent = layer.parent;
		if (!parent || !('visible' in parent)) return;

		if (isVisible) {
			parent.visible = true;
			this.updateParentLayerVisibility(parent, true);
			return;
		}

		if (this.parentHasAnyVisibleChild(parent)) return;

		parent.visible = false;
		this.updateParentLayerVisibility(parent, false);
	}
}
