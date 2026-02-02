import type { IAreaSelectionProvider } from '$lib/services/IAreaSelectionProvider';
import type { IDataSelectionProvider } from '$lib/services/IDataSelectionProvider';
import type { ITabStateProvider } from '$lib/services/ITabStateProvider';
import type { IUserStateProvider } from '$lib/services/IUserStateProvider';
import type { IWebMapService } from '$lib/services/IWebMapService';
import { SelectionType } from '$lib/types/uprn';
import type { UserState, UserStateSelection } from '$lib/types/uprn';

/**
 * Implementation of IUserStateProvider to provide user state information.
 */
export class UserStateProvider implements IUserStateProvider {
	private readonly tabStateProvider: ITabStateProvider;
	private readonly areaSelectionProvider: IAreaSelectionProvider;
	private readonly dataSelectionProvider: IDataSelectionProvider;
	private readonly webMapService: IWebMapService;

	/**
	 * Initializes an instance of UserStateProvider.
	 * @param tabStateProvider The tab state provider.
	 * @param areaSelectionProvider The area selection provider.
	 * @param dataSelectionProvider The data selection provider.
	 * @param webMapService The web map service.
	 */
	constructor(
		tabStateProvider: ITabStateProvider,
		areaSelectionProvider: IAreaSelectionProvider,
		dataSelectionProvider: IDataSelectionProvider,
		webMapService: IWebMapService
	) {
		this.tabStateProvider = tabStateProvider;
		this.areaSelectionProvider = areaSelectionProvider;
		this.dataSelectionProvider = dataSelectionProvider;
		this.webMapService = webMapService;
	}

	/** @inheritdoc */
	public getUserState(): UserState {
		return {
			currentTab: this.tabStateProvider.getTabState(),
			areaSelection: this.getAreaSelection(),
			dataSelections: this.getDataSelections()
		};
	}

	/**
	 * Gets the area selections from the area selection provider.
	 * @returns The area selections.
	 */
	private getAreaSelection(): UserStateSelection | null {
		const info = this.areaSelectionProvider.getAreaSelection();
		if (!info || !info.layerId) return null;
		const roots: UserStateSelection[] = [];
		const leaf = this.upsertLayerPath(roots, info.layerId);
		if (!leaf) return null;

		this.addUniqueFieldChildren(
			leaf,
			info.areaFieldInfos.map((f) => f.id.toString())
		);

		return roots[0] ?? null;
	}

	/**
	 * Gets the data selections from the data selection provider.
	 * @returns The data selections.
	 */
	private getDataSelections(): UserStateSelection[] {
		const selections: UserStateSelection[] = [];
		const infos = this.dataSelectionProvider.getDataSelections();

		for (const info of infos) {
			const leaf = this.upsertLayerPath(selections, info.layerId);
			if (!leaf) continue;
			this.addUniqueFieldChildren(leaf, info.fields);
		}

		return selections;
	}

    	private ensureChildSelection(
		children: UserStateSelection[],
		name: string,
		type: SelectionType
	): UserStateSelection {
		const existing = children.find((c) => c.name === name && c.type === type);
		if (existing) return existing;

		const created: UserStateSelection = {
			name,
			type,
			selectedChildren: []
		};
		children.push(created);
		return created;
	}

	private buildLayerNameChain(layerId: string): string[] {
		const layer = this.webMapService.getLayerById(layerId);
		const layerNameChain: string[] = [];

		if (layer) {
			let current: unknown = layer;
			while (current) {
				const currentLayer = current as __esri.Layer | __esri.Sublayer;
				const title = (currentLayer as unknown as { title?: unknown }).title;
				const name = (currentLayer as unknown as { name?: unknown }).name;
				if (typeof title === 'string' && title.trim().length > 0) {
					layerNameChain.push(title);
				} else if (typeof name === 'string' && name.trim().length > 0) {
					layerNameChain.push(name);
				}
				current = (current as { parent?: unknown }).parent;
			}
			layerNameChain.reverse();
		}

		if (layerNameChain.length === 0) {
			layerNameChain.push(layerId);
		}

		return layerNameChain;
	}

	private upsertLayerPath(roots: UserStateSelection[], layerId: string): UserStateSelection | null {
		const layerNameChain = this.buildLayerNameChain(layerId);

		let currentChildren = roots;
		let currentSelection: UserStateSelection | undefined;
		for (const layerName of layerNameChain) {
			currentSelection = this.ensureChildSelection(currentChildren, layerName, SelectionType.Layer);
			currentChildren = currentSelection.selectedChildren;
		}

		return currentSelection ?? null;
	}

	private addUniqueFieldChildren(selection: UserStateSelection, fieldNames: string[]): void {
		const existingFieldNames = new Set(
			selection.selectedChildren.filter((c) => c.type === SelectionType.Field).map((c) => c.name)
		);

		for (const fieldName of fieldNames) {
			if (existingFieldNames.has(fieldName)) continue;
			selection.selectedChildren.push({
				name: fieldName,
				type: SelectionType.Field,
				selectedChildren: []
			});
			existingFieldNames.add(fieldName);
		}
	}
}
