/**
 * Runtime loader for the ArcGIS Maps SDK for JavaScript via Esri's CDN.
 *
 * This package is consumed as a library that may be mounted in hosts which do not
 * add the ArcGIS CDN script to their HTML. To keep the package self-contained — and,
 * crucially, to keep `@arcgis/core` out of the bundler's module graph (it is huge and
 * causes out-of-memory during the build) — ArcGIS modules are loaded at runtime through
 * the global `window.$arcgis.import()` helper rather than via `import`/`import()`.
 *
 * `@arcgis/core` / `@arcgis/map-components` remain installed as devDependencies for types
 * only; never value-import them. Always load modules through {@link arcgisImport}.
 */

const ARCGIS_CDN_BASE = 'https://js.arcgis.com/5.0/';
const ARCGIS_SCRIPT_SRC = ARCGIS_CDN_BASE;
const ARCGIS_THEME_HREF = `${ARCGIS_CDN_BASE}esri/themes/light/main.css`;

/** Maximum time to wait for `window.$arcgis` to attach after the CDN script loads. */
const READY_TIMEOUT_MS = 15000;
/** Poll interval used while waiting for `window.$arcgis` to attach. */
const READY_POLL_MS = 25;
const LOG_PREFIX = '[uprn/arcgis-loader]';

let loadPromise: Promise<void> | null = null;

function isLoaded(): boolean {
	return typeof window !== 'undefined' && Boolean(window.$arcgis);
}

function injectThemeCss(): void {
	if (document.querySelector(`link[href="${ARCGIS_THEME_HREF}"]`)) {
		console.debug(`${LOG_PREFIX} ArcGIS theme CSS already present`);
		return;
	}

	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = ARCGIS_THEME_HREF;
	document.head.appendChild(link);
	console.info(`${LOG_PREFIX} Injected ArcGIS theme CSS`, { href: ARCGIS_THEME_HREF });
}

/**
 * Resolves once `window.$arcgis` is available, polling briefly since the global may attach
 * a tick after the module script's `load` event fires.
 */
function waitForArcgisReady(): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		const start = Date.now();
		const check = () => {
			if (isLoaded()) {
				console.info(`${LOG_PREFIX} window.$arcgis is ready`);
				resolve();
				return;
			}

			if (Date.now() - start > READY_TIMEOUT_MS) {
				console.error(`${LOG_PREFIX} Timed out waiting for window.$arcgis`);
				reject(new Error('Timed out waiting for window.$arcgis to initialise.'));
				return;
			}

			setTimeout(check, READY_POLL_MS);
		};
		check();
	});
}

function injectScript(): Promise<void> {
	const existing = document.querySelector<HTMLScriptElement>(`script[src="${ARCGIS_SCRIPT_SRC}"]`);
	if (existing) {
		console.info(`${LOG_PREFIX} Found existing ArcGIS CDN script`, { src: ARCGIS_SCRIPT_SRC });
		return waitForArcgisReady();
	}

	return new Promise<void>((resolve, reject) => {
		const script = document.createElement('script');
		script.type = 'module';
		script.src = ARCGIS_SCRIPT_SRC;
		console.info(`${LOG_PREFIX} Injecting ArcGIS CDN script`, { src: ARCGIS_SCRIPT_SRC });
		script.addEventListener('load', () => waitForArcgisReady().then(resolve, reject), {
			once: true
		});
		script.addEventListener(
			'error',
			() => {
				console.error(`${LOG_PREFIX} Failed to load ArcGIS CDN script`, {
					src: ARCGIS_SCRIPT_SRC
				});
				reject(new Error(`Failed to load the ArcGIS CDN script from ${ARCGIS_SCRIPT_SRC}`));
			},
			{ once: true }
		);
		document.head.appendChild(script);
	});
}

/**
 * Ensures the ArcGIS CDN script and light theme are loaded and `window.$arcgis` is ready.
 * Idempotent and safe to call from many places concurrently; resolves immediately if the
 * SDK is already present (e.g. a host that added the script to its HTML).
 *
 * @throws If called during SSR (no `window`) or if the CDN script fails to load.
 */
export function loadArcgis(): Promise<void> {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return Promise.reject(new Error('loadArcgis() can only be called in the browser.'));
	}

	injectThemeCss();

	if (isLoaded()) {
		console.info(`${LOG_PREFIX} ArcGIS SDK already loaded`);
		return Promise.resolve();
	}

	if (!loadPromise) {
		loadPromise = (async () => {
			await injectScript();
		})().catch((error) => {
			// Allow a later call to retry rather than caching a rejected promise forever.
			console.error(`${LOG_PREFIX} ArcGIS SDK load failed`, error);
			loadPromise = null;
			throw error;
		});
	}

	return loadPromise;
}

export const preloadArcgis = loadArcgis;

/**
 * Loads one or more ArcGIS modules from the CDN via `window.$arcgis.import()`, ensuring the
 * SDK is loaded first. Use `@arcgis/core/...` specifiers (with the `.js` suffix), e.g.
 * `arcgisImport('@arcgis/core/WebMap.js')`.
 *
 * Note on return shapes: `$arcgis.import()` returns the module's default export directly for
 * class modules (e.g. `WebMap`, `Color`), and the module namespace for utility modules with
 * named exports (e.g. `config`, `core/urlUtils`, `core/reactiveUtils`).
 *
 * @param module A single module specifier.
 * @returns The imported module (default export or namespace).
 */
export async function arcgisImport<T = unknown>(module: string): Promise<T>;
/**
 * @param modules An array of module specifiers.
 * @returns A tuple of imported modules, in the same order.
 */
export async function arcgisImport<T extends readonly unknown[]>(
	modules: readonly string[]
): Promise<T>;
export async function arcgisImport(modules: string | readonly string[]): Promise<unknown> {
	await loadArcgis();
	try {
		return await window.$arcgis.import(modules as never);
	} catch (error) {
		console.error(`${LOG_PREFIX} Failed to import ArcGIS module(s)`, { modules, error });
		throw error;
	}
}
