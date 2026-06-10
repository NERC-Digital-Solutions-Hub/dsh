import { WebMapStore } from '$lib/Stores/WebMapStore.svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const arcgis = vi.hoisted(() => {
	class FakeWebMap {
		public static readonly instances: FakeWebMap[] = [];
		public readonly portalItem?: FakePortalItem;
		public loaded = false;
		public readonly load = vi.fn(async () => {
			this.loaded = true;
		});
		public readonly loadAll = vi.fn(async () => {
			this.loaded = true;
		});

		constructor(properties: { portalItem?: FakePortalItem } = {}) {
			this.portalItem = properties.portalItem;
			FakeWebMap.instances.push(this);
		}
	}

	class FakePortalItem {
		public static readonly instances: FakePortalItem[] = [];
		public readonly properties: unknown;

		constructor(properties: unknown) {
			this.properties = properties;
			FakePortalItem.instances.push(this);
		}
	}

	return {
		FakePortalItem,
		FakeWebMap,
		addProxyRule: vi.fn(),
		esriConfig: { portalUrl: 'https://default.portal.test' }
	};
});

const customLoader = vi.hoisted(() => ({
	createWebMapFromJson: vi.fn()
}));

vi.mock('@arcgis/core/WebMap', () => ({ default: arcgis.FakeWebMap }));
vi.mock('@arcgis/core/config.js', () => ({ default: arcgis.esriConfig }));
vi.mock('@arcgis/core/portal/PortalItem', () => ({ default: arcgis.FakePortalItem }));
vi.mock('@arcgis/core/core/urlUtils.js', () => ({ addProxyRule: arcgis.addProxyRule }));
vi.mock('@dsh/common/arcgis', () => {
	const modules = new Map<string, unknown>([
		['@arcgis/core/WebMap.js', arcgis.FakeWebMap],
		['@arcgis/core/config.js', arcgis.esriConfig],
		['@arcgis/core/portal/PortalItem.js', arcgis.FakePortalItem],
		['@arcgis/core/core/urlUtils.js', { addProxyRule: arcgis.addProxyRule }]
	]);

	const arcgisImport = vi.fn(async (specifier: string | string[]) => {
		const resolve = (module: string) => {
			if (!modules.has(module)) {
				throw new Error(`Unexpected ArcGIS module import: ${module}`);
			}

			return modules.get(module);
		};

		return Array.isArray(specifier) ? specifier.map(resolve) : resolve(specifier);
	});

	return {
		arcgisImport,
		loadArcgis: vi.fn(async () => {}),
		preloadArcgis: vi.fn(async () => {})
	};
});
vi.mock('$lib/Stores/WebMapCustomLoader', () => ({
	createWebMapFromJson: customLoader.createWebMapFromJson
}));

describe('WebMapStore', () => {
	beforeEach(() => {
		arcgis.FakeWebMap.instances.length = 0;
		arcgis.FakePortalItem.instances.length = 0;
		arcgis.addProxyRule.mockClear();
		arcgis.esriConfig.portalUrl = 'https://default.portal.test';
		customLoader.createWebMapFromJson.mockClear();
		customLoader.createWebMapFromJson.mockImplementation(async () => new arcgis.FakeWebMap());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('loads portal item sources through PortalItem and WebMap', async () => {
		const store = new WebMapStore({
			source: {
				kind: 'portal-item',
				itemId: 'portal-item-id',
				portalUrl: 'https://portal.example.test'
			}
		});

		await store.loadAsync();

		expect(arcgis.esriConfig.portalUrl).toBe('https://portal.example.test');
		expect(arcgis.FakePortalItem.instances).toHaveLength(1);
		expect(arcgis.FakePortalItem.instances[0].properties).toEqual({
			portal: { url: 'https://portal.example.test' },
			id: 'portal-item-id'
		});
		expect(arcgis.FakeWebMap.instances[0].portalItem).toBe(arcgis.FakePortalItem.instances[0]);
		expect(customLoader.createWebMapFromJson).not.toHaveBeenCalled();
		expect(store.isLoaded).toBe(true);
	});

	it('loads static or API webmap JSON through the custom loader without creating a PortalItem', async () => {
		const webmapJson = { operationalLayers: [] };
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(JSON.stringify(webmapJson), { status: 200 }))
		);

		const store = new WebMapStore({
			source: {
				kind: 'webmap-json-url',
				url: '/webmap.json'
			}
		});

		await store.loadAsync();

		expect(fetch).toHaveBeenCalledWith('/webmap.json', { credentials: undefined });
		expect(customLoader.createWebMapFromJson).toHaveBeenCalledWith(
			webmapJson,
			expect.objectContaining({ onLayerHydrated: expect.any(Function) })
		);
		expect(arcgis.FakePortalItem.instances).toHaveLength(0);
		expect(store.isLoaded).toBe(true);
	});

	it('records custom loader failures without marking the webmap as loaded', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(JSON.stringify({ operationalLayers: [] }), { status: 200 }))
		);
		customLoader.createWebMapFromJson.mockRejectedValueOnce(new Error('metadata unavailable'));

		const store = new WebMapStore({
			source: {
				kind: 'webmap-json-url',
				url: '/webmap.json'
			}
		});

		await store.loadAsync();

		expect(store.error).toBe('metadata unavailable');
		expect(store.loading).toBe(false);
		expect(store.isLoaded).toBe(false);
		expect(store.data).toBeNull();
	});

	it('records fetch failures without marking the webmap as loaded', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('not found', { status: 404, statusText: 'Not Found' }))
		);

		const store = new WebMapStore({
			source: {
				kind: 'webmap-json-url',
				url: '/missing-webmap.json'
			}
		});

		await store.loadAsync();

		expect(store.error).toContain(
			'Failed to load webmap JSON from /missing-webmap.json: 404 Not Found'
		);
		expect(store.loading).toBe(false);
		expect(store.isLoaded).toBe(false);
		expect(store.data).toBeNull();
	});
});
