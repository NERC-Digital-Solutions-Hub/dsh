import { mount, unmount } from 'svelte';

import { Spinner } from '$lib/Components/shadcn/spinner';

import type MapView from '@arcgis/core/views/MapView';
import type { ArcgisExpand } from '@arcgis/map-components/components/arcgis-expand';
import type { ArcgisLegend } from '@arcgis/map-components/components/arcgis-legend';
import type { ArcgisSearch } from '@arcgis/map-components/components/arcgis-search';

type ArcgisExpandElement = HTMLElement & ArcgisExpand;
type ArcgisLegendElement = HTMLElement & ArcgisLegend;
type ArcgisSearchElement = HTMLElement & ArcgisSearch;

const SEARCH_PLACEHOLDER = 'Search UK locations';
const SEARCH_URL = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer';
const SEARCH_COUNTRY_CODE = 'GB';

/**
 * Owns ArcGIS widget custom elements added to the MapView UI.
 *
 * The parent Svelte component owns the map container size/layout. This manager only creates,
 * updates, and cleans up programmatic ArcGIS UI children for search, legend, and loading state.
 */
export class ArcgisMapWidgets {
	private readonly mapView: MapView;
	private searchComponent: ArcgisSearchElement | null = null;
	private legendComponent: ArcgisLegendElement | null = null;
	private legendExpandComponent: ArcgisExpandElement | null = null;
	private mapLoadingHandle: __esri.WatchHandle | null = null;
	private searchRowEl: HTMLDivElement | null = null;
	private spinnerSlotEl: HTMLDivElement | null = null;
	private spinnerInstance: Record<string, unknown> | null = null;

	constructor(mapView: MapView) {
		this.mapView = mapView;
	}

	/**
	 * Creates or refreshes the search widget and its adjacent loading spinner.
	 */
	public async ensureSearchComponent(): Promise<void> {
		if (this.searchComponent) {
			this.searchComponent.view = this.mapView;
			return;
		}

		const [{ default: LocatorSearchSource }, { default: Collection }] = await Promise.all([
			import('@arcgis/core/widgets/Search/LocatorSearchSource.js'),
			import('@arcgis/core/core/Collection.js'),
			import('@arcgis/map-components/components/arcgis-search')
		]);

		const ukSource = new LocatorSearchSource({
			url: SEARCH_URL,
			countryCode: SEARCH_COUNTRY_CODE,
			placeholder: SEARCH_PLACEHOLDER
		});

		const sources = new Collection<__esri.LayerSearchSource | __esri.LocatorSearchSource>();
		sources.add(ukSource);

		const searchContainerEl = document.createElement('div');
		this.searchRowEl = document.createElement('div');
		this.searchRowEl.className = 'uprn-map-search-row';

		this.spinnerSlotEl = document.createElement('div');
		this.spinnerSlotEl.className = 'uprn-map-spinner-slot';
		this.spinnerInstance = mount(Spinner, {
			target: this.spinnerSlotEl,
			props: { class: 'size-5' }
		});

		this.searchRowEl.appendChild(this.spinnerSlotEl);
		this.searchRowEl.appendChild(searchContainerEl);

		this.searchComponent = document.createElement('arcgis-search') as ArcgisSearchElement;
		this.searchComponent.view = this.mapView;
		this.searchComponent.popupDisabled = true;
		this.searchComponent.includeDefaultSourcesDisabled = true;
		this.searchComponent.allPlaceholder = SEARCH_PLACEHOLDER;
		this.searchComponent.sources = sources;
		searchContainerEl.appendChild(this.searchComponent);

		this.mapView.ui.add(this.searchRowEl, 'top-right');
	}

	/**
	 * Creates or refreshes the legend widget inside an ArcGIS expand container.
	 */
	public async ensureLegendComponent(): Promise<void> {
		if (this.legendComponent || this.legendExpandComponent) {
			if (this.legendComponent) {
				this.legendComponent.view = this.mapView;
			}
			if (this.legendExpandComponent) {
				this.legendExpandComponent.view = this.mapView;
			}
			return;
		}

		await Promise.all([
			import('@arcgis/map-components/components/arcgis-legend'),
			import('@arcgis/map-components/components/arcgis-expand')
		]);

		this.legendComponent = document.createElement('arcgis-legend') as ArcgisLegendElement;
		this.legendComponent.view = this.mapView;

		this.legendExpandComponent = document.createElement('arcgis-expand') as ArcgisExpandElement;
		this.legendExpandComponent.view = this.mapView;
		this.legendExpandComponent.label = 'Legend';
		this.legendExpandComponent.expandTooltip = 'Legend';
		this.legendExpandComponent.appendChild(this.legendComponent);

		this.mapView.ui.add(this.legendExpandComponent, 'top-right');
	}

	/**
	 * Watches MapView loading state and exposes it through the spinner slot.
	 */
	public async setupMapLoadingWatcher(): Promise<void> {
		this.cleanupMapLoadingWatcher();

		const reactiveUtils = await import('@arcgis/core/core/reactiveUtils.js');

		this.mapLoadingHandle = reactiveUtils.watch(
			() => this.mapView.updating,
			(updating) => {
				if (this.spinnerSlotEl) {
					this.spinnerSlotEl.style.display = updating ? 'flex' : 'none';
				}
			},
			{ initial: true }
		);
	}

	/**
	 * Indicates whether the legend expand widget is currently open.
	 */
	public isLegendExpanded(): boolean {
		return this.legendExpandComponent?.expanded ?? false;
	}

	/**
	 * Opens the legend when closed and closes it when open.
	 */
	public toggleLegend(): void {
		if (!this.legendExpandComponent) {
			return;
		}

		this.legendExpandComponent.expanded = !this.legendExpandComponent.expanded;
	}

	/**
	 * Removes widgets, Svelte-mounted spinner content, and ArcGIS watchers.
	 */
	public cleanup(): void {
		this.cleanupMapLoadingWatcher();

		if (this.spinnerInstance) {
			void unmount(this.spinnerInstance);
			this.spinnerInstance = null;
		}

		if (this.searchComponent) {
			void this.searchComponent.destroy();
			this.searchComponent = null;
		}

		if (this.searchRowEl) {
			this.mapView.ui.remove(this.searchRowEl);
			this.searchRowEl = null;
			this.spinnerSlotEl = null;
		}

		if (this.legendExpandComponent) {
			this.mapView.ui.remove(this.legendExpandComponent);
			void this.legendExpandComponent.destroy();
			this.legendExpandComponent = null;
		}

		if (this.legendComponent) {
			void this.legendComponent.destroy();
			this.legendComponent = null;
		}
	}

	private cleanupMapLoadingWatcher(): void {
		this.mapLoadingHandle?.remove();
		this.mapLoadingHandle = null;
		if (this.spinnerSlotEl) {
			this.spinnerSlotEl.style.display = 'none';
		}
	}
}
