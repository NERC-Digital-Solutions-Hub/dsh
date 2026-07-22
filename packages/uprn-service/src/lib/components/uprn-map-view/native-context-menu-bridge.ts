const blockedRightClickEvents = [
	'pointerdown',
	'pointerup',
	'mousedown',
	'mouseup',
	'click',
	'auxclick'
] as const;

/** Bridges map-surface native right-clicks to the Bits UI context-menu trigger. */
export function attachNativeContextMenuBridge(
	shell: HTMLElement,
	getTrigger: () => HTMLElement | null
): () => void {
	let dispatchingSyntheticContextMenu = false;

	const isMapWidgetTarget = (target: EventTarget | null): boolean =>
		target instanceof Element &&
		Boolean(
			target.closest(
				[
					'.esri-ui',
					'.esri-popup',
					'.esri-widget',
					'.esri-component',
					'.uprn-map-search-row',
					'arcgis-expand',
					'arcgis-legend',
					'arcgis-search'
				].join(', ')
			)
		);
	const stopMapRightClickInteraction = (event: Event) => {
		if (!(event instanceof MouseEvent)) return;
		if (!(event.button === 2 || (event.buttons & 2) === 2)) return;
		if (isMapWidgetTarget(event.target)) return;
		event.stopImmediatePropagation();
		event.stopPropagation();
	};
	const handleCapturedContextMenu = (event: MouseEvent) => {
		if (dispatchingSyntheticContextMenu) return;
		if (isMapWidgetTarget(event.target)) {
			event.stopPropagation();
			return;
		}
		const trigger = getTrigger();
		if (!trigger) return;
		event.preventDefault();
		event.stopPropagation();
		dispatchingSyntheticContextMenu = true;
		trigger.dispatchEvent(
			new MouseEvent('contextmenu', {
				bubbles: true,
				button: 2,
				buttons: event.buttons || 2,
				cancelable: true,
				clientX: event.clientX,
				clientY: event.clientY,
				ctrlKey: event.ctrlKey,
				metaKey: event.metaKey,
				shiftKey: event.shiftKey
			})
		);
		dispatchingSyntheticContextMenu = false;
	};

	for (const eventName of blockedRightClickEvents) {
		shell.addEventListener(eventName, stopMapRightClickInteraction, { capture: true });
	}
	shell.addEventListener('contextmenu', handleCapturedContextMenu, { capture: true });

	return () => {
		for (const eventName of blockedRightClickEvents) {
			shell.removeEventListener(eventName, stopMapRightClickInteraction, { capture: true });
		}
		shell.removeEventListener('contextmenu', handleCapturedContextMenu, { capture: true });
	};
}
