type IdleDeadline = {
	didTimeout: boolean;
	timeRemaining: () => number;
};

type RequestIdleCallback = (
	callback: (deadline: IdleDeadline) => void,
	options?: { timeout?: number }
) => number;

type CancelIdleCallback = (handle: number) => void;

type BrowserGlobal = typeof globalThis & {
	requestIdleCallback?: RequestIdleCallback;
	cancelIdleCallback?: CancelIdleCallback;
};

export function installBrowserPolyfills(): void {
	if (typeof window === 'undefined') {
		return;
	}

	const browserGlobal = globalThis as BrowserGlobal;

	if (!browserGlobal.requestIdleCallback) {
		browserGlobal.requestIdleCallback = (callback, options) => {
			const start = Date.now();
			const timeout = options?.timeout ?? 1;

			return window.setTimeout(() => {
				callback({
					didTimeout: false,
					timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
				});
			}, timeout);
		};
	}

	if (!browserGlobal.cancelIdleCallback) {
		browserGlobal.cancelIdleCallback = (handle) => {
			window.clearTimeout(handle);
		};
	}
}
