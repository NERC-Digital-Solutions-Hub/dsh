<script lang="ts">
	/**
	 * Sidebar Component
	 *
	 * A resizable sidebar that can be positioned on any side of the screen.
	 *
	 * Props:
	 * - isOpen: boolean - Controls whether the sidebar is open or closed
	 * - onToggle: () => void - Callback when the toggle button is clicked
	 * - position: SidebarPosition value - Position of the sidebar (default: SidebarPosition.LEFT)
	 * - minSize: string - Minimum size of the sidebar (default: '500px' for left/right, '300px' for top/bottom)
	 * - openIcon: Icon component - Custom icon to display when sidebar is closed (default: Menu)
	 * - children: Snippet - Content to render inside the sidebar
	 */
	import type { Snippet } from 'svelte';
	import { Menu, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { SidebarPosition } from './sidebar-position';

	type SidebarPositionType = (typeof SidebarPosition)[keyof typeof SidebarPosition];

	type Props = {
		isOpen: boolean;
		onToggle: () => void;
		children?: Snippet;
		minSize?: string;
		position?: SidebarPositionType;
		openIcon?: typeof Menu;
		overlay?: boolean;
	};

	const {
		isOpen,
		onToggle,
		children,
		minSize,
		position = SidebarPosition.LEFT,
		openIcon = Menu,
		overlay = false
	}: Props = $props();

	// Constants
	const RESIZE_HANDLE_SIZE = 8;
	const DEFAULT_SIZE = 500;
	const HEADER_OFFSET = 'calc(var(--header-height, 64px) + 1rem)';

	// State
	let sidebarElement: HTMLElement;
	let sidebarSize = $state(0);
	let currentSize = $state(DEFAULT_SIZE);
	let isResizing = $state(false);

	// Derived values
	const isHorizontal = $derived(
		position === SidebarPosition.LEFT || position === SidebarPosition.RIGHT
	);
	const isStartPosition = $derived(
		position === SidebarPosition.LEFT || position === SidebarPosition.TOP
	);
	const defaultMinSize = $derived(isHorizontal ? '500px' : '100px');
	const finalMinSize = $derived(minSize ?? defaultMinSize);
	const minSizePx = $derived(parseFloat(finalMinSize));
	const sizeProperty = $derived(isHorizontal ? 'width' : 'height');
	const resizeCursor = $derived(isHorizontal ? 'ew-resize' : 'ns-resize');

	// Ensure current size meets minimum requirements
	$effect(() => {
		const parsedSize = parseFloat(finalMinSize);
		if (currentSize < parsedSize) {
			currentSize = parsedSize;
		}
	});

	// Track sidebar size with ResizeObserver
	onMount(() => {
		if (!sidebarElement) return;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				sidebarSize = isHorizontal ? entry.contentRect.width : entry.contentRect.height;
			}
		});

		resizeObserver.observe(sidebarElement);
		return () => resizeObserver.disconnect();
	});

	// Handle resize dragging
	function startResize(e: MouseEvent) {
		if (!isOpen) return;

		isResizing = true;
		e.preventDefault();

		const startPos = isHorizontal ? e.clientX : e.clientY;
		const startSize = currentSize;

		function onMouseMove(e: MouseEvent) {
			const currentPos = isHorizontal ? e.clientX : e.clientY;
			const delta = isStartPosition ? currentPos - startPos : startPos - currentPos;
			currentSize = Math.max(minSizePx, startSize + delta);
		}

		function onMouseUp() {
			isResizing = false;
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
		}

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
		document.body.style.cursor = resizeCursor;
		document.body.style.userSelect = 'none';
	}

	// UI configuration helpers
	const buttonPosition = $derived(() => {
		const offset = isOpen ? currentSize : 0;
		if (overlay) {
			const overlayPositionMap = {
				[SidebarPosition.LEFT]: { top: '1rem', left: `${offset}px` },
				[SidebarPosition.RIGHT]: { top: '1rem', right: `${offset}px` },
				[SidebarPosition.TOP]: { top: `${offset}px`, left: '1rem' },
				[SidebarPosition.BOTTOM]: { bottom: `${offset}px`, left: '1rem' }
			};
			return overlayPositionMap[position];
		}

		const positionMap = {
			[SidebarPosition.LEFT]: { top: HEADER_OFFSET, left: `${offset}px` },
			[SidebarPosition.RIGHT]: { top: HEADER_OFFSET, right: `${offset}px` },
			[SidebarPosition.TOP]: { top: `${offset}px`, left: '1rem' },
			[SidebarPosition.BOTTOM]: { bottom: `${offset}px`, left: '1rem' }
		};
		return positionMap[position];
	});

	// Calculate button transform - matches sidebar transform for smooth animation
	const buttonTransform = $derived(() => {
		if (isOpen) return 'translate(0, 0)';

		// Button should follow sidebar's sliding animation
		const transformMap = {
			[SidebarPosition.LEFT]: `translate(-${currentSize}px, 0)`,
			[SidebarPosition.RIGHT]: `translate(${currentSize}px, 0)`,
			[SidebarPosition.TOP]: `translate(0, -${currentSize}px)`,
			[SidebarPosition.BOTTOM]: `translate(0, ${currentSize}px)`
		};
		return transformMap[position];
	});

	const buttonRounding = $derived(() => {
		const roundingMap = {
			[SidebarPosition.LEFT]: 'rounded-l-none rounded-r-md',
			[SidebarPosition.RIGHT]: 'rounded-r-none rounded-l-md',
			[SidebarPosition.TOP]: 'rounded-t-none rounded-b-md',
			[SidebarPosition.BOTTOM]: 'rounded-b-none rounded-t-md'
		};
		return roundingMap[position];
	});

	const closeIcon = $derived(() => {
		const iconMap = {
			[SidebarPosition.LEFT]: ChevronLeft,
			[SidebarPosition.RIGHT]: ChevronRight,
			[SidebarPosition.TOP]: ChevronUp,
			[SidebarPosition.BOTTOM]: ChevronDown
		};
		return iconMap[position];
	});

	const contentPadding = $derived(() => {
		const paddingMap = {
			[SidebarPosition.LEFT]: `padding-right: ${RESIZE_HANDLE_SIZE}px`,
			[SidebarPosition.RIGHT]: `padding-left: ${RESIZE_HANDLE_SIZE}px`,
			[SidebarPosition.TOP]: `padding-bottom: ${RESIZE_HANDLE_SIZE}px`,
			[SidebarPosition.BOTTOM]: `padding-top: ${RESIZE_HANDLE_SIZE}px`
		};
		return paddingMap[position];
	});

	const handleStyle = $derived(() => {
		const size = `${RESIZE_HANDLE_SIZE}px`;
		const offset = `${-RESIZE_HANDLE_SIZE / 2}px`;
		const styleMap = {
			[SidebarPosition.LEFT]: `width: ${size}; right: ${offset}`,
			[SidebarPosition.RIGHT]: `width: ${size}; left: ${offset}`,
			[SidebarPosition.TOP]: `height: ${size}; bottom: ${offset}`,
			[SidebarPosition.BOTTOM]: `height: ${size}; top: ${offset}`
		};
		return styleMap[position];
	});

	// Helper to convert object to inline styles
	function toInlineStyles(styles: Record<string, string>): string {
		return Object.entries(styles)
			.map(([key, value]) => `${key}: ${value}`)
			.join('; ');
	}

	// Compute sidebar order (0 for start positions, 1 for end positions)
	const sidebarOrder = $derived(isStartPosition ? 0 : 1);

	// Calculate transform for sliding animation
	const sidebarTransform = $derived(() => {
		if (isOpen) return 'translate(0, 0)';

		const transformMap = {
			[SidebarPosition.LEFT]: `translate(-${currentSize}px, 0)`,
			[SidebarPosition.RIGHT]: `translate(${currentSize}px, 0)`,
			[SidebarPosition.TOP]: `translate(0, -${currentSize}px)`,
			[SidebarPosition.BOTTOM]: `translate(0, ${currentSize}px)`
		};
		return transformMap[position];
	});

	const wrapperStyles = $derived(() => {
		const sizeValue = isOpen ? `${currentSize}px` : '0';
		if (overlay) {
			if (isHorizontal) {
				const horizontalStyles: Record<string, string> = {
					position: 'absolute',
					top: '0',
					bottom: '0',
					width: sizeValue,
					height: '100%',
					'z-index': '30'
				};
				horizontalStyles[position === SidebarPosition.LEFT ? 'left' : 'right'] = '0';
				return horizontalStyles;
			}

			const verticalStyles: Record<string, string> = {
				position: 'absolute',
				left: '0',
				right: '0',
				height: sizeValue,
				width: '100%',
				'z-index': '30'
			};
			verticalStyles[position === SidebarPosition.TOP ? 'top' : 'bottom'] = '0';
			return verticalStyles;
		}

		return {
			[sizeProperty]: sizeValue,
			order: `${sidebarOrder}`
		};
	});
</script>

<!-- Toggle button that moves with sidebar -->
<Button
	onclick={onToggle}
	variant="default"
	size="icon"
	class="{overlay
		? 'absolute'
		: 'fixed'} z-[40] !bg-primary shadow-lg hover:scale-105 hover:!bg-primary/90 {buttonRounding()} {isResizing
		? ''
		: 'transition-all duration-300'}"
	style="{toInlineStyles(buttonPosition())}; pointer-events: auto;"
	aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
	aria-expanded={isOpen}
>
	{#if isOpen}
		{@const Icon = closeIcon()}
		<Icon class="h-6 w-6" />
	{:else}
		{@const OpenIcon = openIcon}
		<OpenIcon class="h-6 w-6" />
	{/if}
</Button>

<!-- Sidebar wrapper for clipping -->
<div
	class="relative"
	class:overflow-hidden={!overlay}
	class:overflow-visible={overlay}
	class:h-full={isHorizontal}
	class:w-full={!isHorizontal}
	class:transition-all={!isResizing}
	class:duration-300={!isResizing}
	class:z-30={overlay}
	style={toInlineStyles(wrapperStyles())}
>
	<!-- Sidebar -->
	<aside
		bind:this={sidebarElement}
		class="relative flex bg-card text-card-foreground shadow-lg"
		class:flex-col={isHorizontal}
		class:flex-row={!isHorizontal}
		class:h-full={isHorizontal}
		class:w-full={!isHorizontal}
		class:border-r={position === SidebarPosition.LEFT}
		class:border-l={position === SidebarPosition.RIGHT}
		class:border-b={position === SidebarPosition.TOP}
		class:border-t={position === SidebarPosition.BOTTOM}
		class:border-sidebar-border={true}
		class:transition-transform={!isResizing}
		class:duration-300={!isResizing}
		class:pointer-events-auto={overlay}
		class:z-30={overlay}
		style="{sizeProperty}: {currentSize}px; transform: {sidebarTransform()};"
	>
		<div
			class="flex overflow-hidden"
			class:flex-col={isHorizontal}
			class:flex-row={!isHorizontal}
			class:h-full={isHorizontal}
			class:w-full={!isHorizontal}
			style={contentPadding()}
		>
			<!-- Content -->
			<div
				class="flex overflow-hidden"
				class:flex-col={isHorizontal}
				class:flex-row={!isHorizontal}
				class:h-full={isHorizontal}
				class:w-full={!isHorizontal}
			>
				{#if children}
					{@render children()}
				{/if}
			</div>
		</div>

		<!-- Resize handle -->
		{#if isOpen}
			<Button
				class="absolute border-0 bg-transparent p-0 transition-colors hover:!bg-primary/50 {isHorizontal
					? 'top-0 h-full cursor-ew-resize'
					: 'left-0 w-full cursor-ns-resize'}"
				onmousedown={startResize}
				aria-label="Resize sidebar by dragging"
				style={handleStyle()}
			/>
		{/if}
	</aside>
</div>
