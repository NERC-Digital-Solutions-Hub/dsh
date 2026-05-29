// Pull in the ambient `__esri` global namespace from @arcgis/core. ArcGIS modules are loaded
// from the CDN at runtime (never value-imported), so this explicit reference is what keeps the
// `__esri.*` types available across the codebase.
/// <reference types="@arcgis/core/interfaces" />

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	/**
	 * Global helper attached by the ArcGIS Maps SDK CDN bundle (https://js.arcgis.com/5.0/).
	 * Used to load ArcGIS modules at runtime so they are never bundled. Prefer the typed
	 * wrapper in `$lib/Utilities/ArcgisLoader` (`arcgisImport`) over touching this directly.
	 */
	interface Window {
		$arcgis: {
			import<T = unknown>(module: string): Promise<T>;
			import<T extends readonly unknown[]>(modules: readonly string[]): Promise<T>;
		};
	}
}

export {};
