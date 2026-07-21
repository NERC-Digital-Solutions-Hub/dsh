import { onMount } from 'svelte';

const MAX_VIEWPORT_PERCENTAGE = 0.6;

type SidebarResizeOptions = {
	getElement: () => HTMLElement | undefined;
	getIsOpen: () => boolean;
	getIsHorizontal: () => boolean;
	getIsStartPosition: () => boolean;
	getOriginalSize: () => string;
	getResizeCursor: () => string;
};

/**
 * Owns responsive sidebar sizing and the document-level pointer listeners used while resizing.
 * Layout direction and the default size remain controlled by the sidebar component.
 */
export function useSidebarResize(options: SidebarResizeOptions) {
	let sidebarSize = $state(0);
	let currentSize = $state('0px');
	let isResizing = $state(false);
	let hasManuallyResized = $state(false);
	let viewportWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1280);
	let viewportHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 720);

	$effect(() => {
		if (!hasManuallyResized) {
			currentSize = options.getOriginalSize();
		}
	});

	onMount(() => {
		const sidebarElement = options.getElement();
		if (!sidebarElement) return;

		let lastBucket: number | null = null;
		const getBucket = (width: number): number => {
			if (width >= 1280) return 1280;
			if (width >= 1024) return 1024;
			if (width >= 768) return 768;
			return 0;
		};
		const syncToResponsiveDefaults = () => {
			const nextBucket = getBucket(window.innerWidth);
			if (lastBucket === null) {
				lastBucket = nextBucket;
				return;
			}
			if (nextBucket !== lastBucket) {
				lastBucket = nextBucket;
				hasManuallyResized = false;
				currentSize = options.getOriginalSize();
			}
		};

		const mediaQueries = [1280, 1024, 768].map((width) =>
			window.matchMedia(`(min-width: ${width}px)`)
		);
		const handleMediaChange = () => syncToResponsiveDefaults();
		for (const mediaQuery of mediaQueries) {
			mediaQuery.addEventListener('change', handleMediaChange);
		}
		syncToResponsiveDefaults();

		const handleViewportResize = () => {
			viewportWidth = window.innerWidth;
			viewportHeight = window.innerHeight;
		};
		window.addEventListener('resize', handleViewportResize);

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				sidebarSize = options.getIsHorizontal()
					? entry.contentRect.width
					: entry.contentRect.height;
			}
		});
		resizeObserver.observe(sidebarElement);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener('resize', handleViewportResize);
			for (const mediaQuery of mediaQueries) {
				mediaQuery.removeEventListener('change', handleMediaChange);
			}
		};
	});

	function startResize(event: PointerEvent): void {
		const sidebarElement = options.getElement();
		if (!options.getIsOpen() || !sidebarElement) return;

		isResizing = true;
		event.preventDefault();

		const horizontal = options.getIsHorizontal();
		const startPosition = horizontal ? event.clientX : event.clientY;
		const rect = sidebarElement.getBoundingClientRect();
		const startSize = horizontal ? rect.width : rect.height;
		const computed = getComputedStyle(sidebarElement);
		const computedMin = horizontal ? computed.minWidth : computed.minHeight;
		const parsedMin = Number.parseFloat(computedMin);
		const minSize = Number.isFinite(parsedMin) ? parsedMin : 0;
		const viewportSize = horizontal ? viewportWidth : viewportHeight;
		const maxSize = Math.max(minSize, viewportSize * MAX_VIEWPORT_PERCENTAGE);

		const handlePointerMove = (moveEvent: PointerEvent) => {
			const currentPosition = horizontal ? moveEvent.clientX : moveEvent.clientY;
			const delta = options.getIsStartPosition()
				? currentPosition - startPosition
				: startPosition - currentPosition;
			const nextSize = Math.min(Math.max(minSize, startSize + delta), maxSize);
			currentSize = `${nextSize}px`;
			hasManuallyResized = true;
		};
		const stopResize = () => {
			isResizing = false;
			document.removeEventListener('pointermove', handlePointerMove);
			document.removeEventListener('pointerup', stopResize);
			document.removeEventListener('pointercancel', stopResize);
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
		};

		document.addEventListener('pointermove', handlePointerMove);
		document.addEventListener('pointerup', stopResize);
		document.addEventListener('pointercancel', stopResize);
		document.body.style.cursor = options.getResizeCursor();
		document.body.style.userSelect = 'none';
	}

	return {
		get sidebarSize() {
			return sidebarSize;
		},
		get currentSize() {
			return currentSize;
		},
		get isResizing() {
			return isResizing;
		},
		startResize
	};
}
