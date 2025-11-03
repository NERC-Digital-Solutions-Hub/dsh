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
	import { Button } from '$lib/components/ui/button';
	import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Menu } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { SidebarPosition } from './sidebar-position';

	type SidebarPositionType = (typeof SidebarPosition)[keyof typeof SidebarPosition];

	type Props = {
		isOpen: boolean;
		onToggle: () => void;
		children?: Snippet;
		minSize?: string;
		originalSize?: string;
		position?: SidebarPositionType;
		openIcon?: typeof Menu;
	};

	const {
		isOpen,
		onToggle,
		children,
		minSize,
		originalSize,
		position = SidebarPosition.LEFT,
		openIcon = Menu
	}: Props = $props();

	// Constants
	const RESIZE_HANDLE_SIZE = 8;
	const DEFAULT_SIZE = '500px';
	const HEADER_OFFSET = 'var(--header-height, 64px)';

	// State
	let sidebarElement: HTMLElement;
	let sidebarSize = $state(0);
	let currentSize = $state(originalSize ?? DEFAULT_SIZE);
	let isResizing = $state(false);
	let hasManuallyResized = $state(false);

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

	// Update current size when minSize or originalSize changes (only if user hasn't manually resized)
	$effect(() => {
		if (!hasManuallyResized) {
			currentSize = originalSize ?? finalMinSize;
			console.log(
				'Sidebar size updated due to minSize/originalSize change:',
				currentSize,
				originalSize
			);
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
		const startSize = parseFloat(currentSize);

		function onMouseMove(e: MouseEvent) {
			const currentPos = isHorizontal ? e.clientX : e.clientY;
			const delta = isStartPosition ? currentPos - startPos : startPos - currentPos;
			const newSize = Math.max(minSizePx, startSize + delta);
			currentSize = `${newSize}px`;
			hasManuallyResized = true;
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
		const offset = isOpen ? currentSize : '0px';
		const positionMap = {
			[SidebarPosition.LEFT]: { top: HEADER_OFFSET, left: offset },
			[SidebarPosition.RIGHT]: { top: HEADER_OFFSET, right: offset },
			[SidebarPosition.TOP]: { top: offset },
			[SidebarPosition.BOTTOM]: { bottom: offset }
		};
		return positionMap[position];
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

	// Position for resize handle when moved outside wrapper
	const handlePosition = $derived(() => {
		if (!isOpen) return {};

		const size = `${RESIZE_HANDLE_SIZE}px`;
		const sidebarOffset = isOpen ? `calc(${currentSize} + ${-RESIZE_HANDLE_SIZE / 2}px)` : '0px';

		const positionMap = {
			[SidebarPosition.LEFT]: {
				left: sidebarOffset,
				top: '0',
				width: size,
				height: '100%'
			},
			[SidebarPosition.RIGHT]: {
				right: sidebarOffset,
				top: '0',
				width: size,
				height: '100%'
			},
			[SidebarPosition.TOP]: {
				top: sidebarOffset,
				left: '0',
				height: size,
				width: '100%'
			},
			[SidebarPosition.BOTTOM]: {
				bottom: sidebarOffset,
				left: '0',
				height: size,
				width: '100%'
			}
		};

		return positionMap[position];
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
			[SidebarPosition.LEFT]: `translate(-${currentSize}, 0)`,
			[SidebarPosition.RIGHT]: `translate(${currentSize}, 0)`,
			[SidebarPosition.TOP]: `translate(0, -${currentSize})`,
			[SidebarPosition.BOTTOM]: `translate(0, ${currentSize})`
		};
		return transformMap[position];
	});

	const wrapperStyles = $derived(() => {
		const sizeValue = isOpen ? currentSize : '0px';
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
	class="fixed z-2 -ml-1 inline-flex size-7 
	shrink-0 items-center justify-center gap-2 overflow-hidden rounded-md bg-background text-sm
	font-medium whitespace-nowrap shadow-none outline-hidden transition-all select-none hover:bg-accent focus-visible:border-ring 
	focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 {!isResizing
		? 'transition-all duration-300'
		: ''}"
	style="{toInlineStyles(buttonPosition())}; pointer-events: auto; {isResizing
		? 'transition: none !important;'
		: ''}"
	aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
	aria-expanded={isOpen}
>
	<!--aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive 
	focus-visible:border-ring focus-visible:ring-ring/50 relative inline-flex shrink-0 items-center 
	justify-center gap-2 overflow-hidden rounded-md text-sm font-medium whitespace-nowrap outline-hidden 
	transition-all select-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 
	[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:bg-accent 
	hover:text-accent-foreground dark:hover:bg-accent/50 size-7 -ml-1 -->
	{#if isOpen}
		{@const Icon = closeIcon()}
		<Icon class="h-6 w-6 text-primary" />
	{:else}
		{@const OpenIcon = openIcon}
		<OpenIcon class="h-6 w-6 text-primary" />
	{/if}
</Button>

<!-- Sidebar wrapper for clipping -->
<div
	class="relative z-3 h-full w-full overflow-hidden transition-all duration-300"
	class:h-full={isHorizontal}
	class:w-full={!isHorizontal}
	class:transition-all={!isResizing}
	class:duration-300={!isResizing}
	style={toInlineStyles(wrapperStyles())}
>
	<!-- Sidebar -->
	<aside
		bind:this={sidebarElement}
		class="border-r-bg-sidebar-border relative flex border-r-1 bg-sidebar text-sidebar-foreground shadow-lg"
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
		style="{sizeProperty}: {currentSize}; transform: {sidebarTransform()};"
	>
		<div
			class="flex overflow-hidden"
			class:flex-col={isHorizontal}
			class:flex-row={!isHorizontal}
			class:h-full={isHorizontal}
			class:w-full={!isHorizontal}
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
	</aside>
</div>

<!-- Resize handle (outside wrapper to avoid clipping) -->
{#if isOpen}
	<Button
		class="fixed z-40 border-0 bg-transparent p-0 ring-0 transition-colors outline-none hover:!bg-primary/50 focus-visible:ring-0 {isHorizontal
			? 'cursor-ew-resize'
			: 'cursor-ns-resize'} {!isResizing ? 'transition-all duration-300' : ''}"
		onmousedown={startResize}
		aria-label="Resize sidebar by dragging"
		style="{toInlineStyles(
			handlePosition()
		)}; outline: none !important; box-shadow: none !important; border: none !important;"
	/>
{/if}
