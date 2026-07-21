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
	 * - minSize: string (optional) - Minimum size override (default comes from CSS vars)
	 * - originalSize: string (optional) - Initial size override (default comes from CSS vars)
	 * - openIcon: Icon component - Custom icon to display when sidebar is closed (default: Menu)
	 * - children: Snippet - Content to render inside the sidebar
	 */
	import { Button } from '$lib/components/shadcn/button';
	import * as Tooltip from '$lib/components/shadcn/tooltip/index.js';
	import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Menu } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { SidebarPosition } from './sidebar-position';
	import { useSidebarResize } from './use-sidebar-resize.svelte';

	type SidebarPositionType = (typeof SidebarPosition)[keyof typeof SidebarPosition];

	type Props = {
		isOpen: boolean;
		onToggle: () => void;
		children?: Snippet;
		position?: SidebarPositionType;
		hideToggleButton?: boolean;
		openIcon?: typeof Menu;
		/** Optional override; otherwise uses responsive CSS variables */
		originalSize?: string;
		/** Optional override; otherwise uses responsive CSS variables */
		minSize?: string;
	};

	const {
		isOpen,
		onToggle,
		children,
		position = SidebarPosition.LEFT,
		hideToggleButton = false,
		openIcon = Menu,
		originalSize,
		minSize
	}: Props = $props();

	// Constants
	const DEFAULT_MIN_WIDTH = 500;
	const DEFAULT_MIN_HEIGHT = 100;
	const RESIZE_HANDLE_SIZE = 6;
	let sidebarElement: HTMLElement;

	// Derived values
	const isHorizontal = $derived(
		position === SidebarPosition.LEFT || position === SidebarPosition.RIGHT
	);
	const isStartPosition = $derived(
		position === SidebarPosition.LEFT || position === SidebarPosition.TOP
	);
	const defaultOriginalSize = $derived(
		isHorizontal
			? 'var(--dsh-sidebar-original-size, 500px)'
			: 'var(--dsh-sidebar-original-size-vertical, 300px)'
	);
	const defaultMinSize = $derived(
		minSize
			? String(minSize).match(/^\d+$/)
				? `${minSize}px`
				: minSize
			: isHorizontal
				? `var(--dsh-sidebar-min-size, ${DEFAULT_MIN_WIDTH}px)`
				: `var(--dsh-sidebar-min-size-vertical, ${DEFAULT_MIN_HEIGHT}px)`
	);
	const finalOriginalSize = $derived(originalSize ?? defaultOriginalSize);
	const sizeProperty = $derived(isHorizontal ? 'width' : 'height');
	const resizeCursor = $derived(isHorizontal ? 'ew-resize' : 'ns-resize');

	const resize = useSidebarResize({
		getElement: () => sidebarElement,
		getIsOpen: () => isOpen,
		getIsHorizontal: () => isHorizontal,
		getIsStartPosition: () => isStartPosition,
		getOriginalSize: () => finalOriginalSize,
		getResizeCursor: () => resizeCursor
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

	const handleStyles = $derived(() => {
		const size = `${RESIZE_HANDLE_SIZE}px`;
		return isHorizontal ? { width: size, height: '100%' } : { height: size, width: '100%' };
	});

	// Helper to convert object to inline styles
	function toInlineStyles(styles: Record<string, string>): string {
		return Object.entries(styles)
			.map(([key, value]) => `${key}: ${value}`)
			.join('; ');
	}

	// Flex direction: flips for end positions so button sits on the content-facing side
	const flexDirection = $derived(() => {
		const map: Record<string, string> = {
			[SidebarPosition.LEFT]: 'row',
			[SidebarPosition.RIGHT]: 'row-reverse',
			[SidebarPosition.TOP]: 'column',
			[SidebarPosition.BOTTOM]: 'column-reverse'
		};
		return map[position];
	});

	// Sidebar order in parent layout (0 for start positions, 1 for end positions)
	const sidebarOrder = $derived(isStartPosition ? 0 : 1);

	// Wrapper size: panel width when open, 0 when closed.
	// The toggle button is positioned absolutely and overflows the wrapper.
	// The resize handle overlaps the sidebar edge via negative margin.
	const wrapperSize = $derived(() => {
		if (isOpen) {
			return `max(${resize.currentSize}, ${defaultMinSize})`;
		}
		return '0px';
	});

	const clipperSize = $derived(isOpen ? `max(${resize.currentSize}, ${defaultMinSize})` : '0px');

	// Clipper justify-content: anchors content to the correct edge for slide direction
	const clipperJustify = $derived(isStartPosition ? 'flex-start' : 'flex-end');
</script>

<!-- Sidebar: wrapper takes layout space, flex arranges panel clipper + toggle button -->
<div
	class="dsh-sidebar relative z-3 overflow-visible"
	class:is-horizontal={isHorizontal}
	class:h-full={isHorizontal}
	class:w-full={!isHorizontal}
	class:transition-all={!resize.isResizing}
	class:duration-300={!resize.isResizing}
	style="{sizeProperty}: {wrapperSize()}; order: {sidebarOrder};"
>
	<div
		class="flex"
		class:h-full={isHorizontal}
		class:w-full={!isHorizontal}
		style="flex-direction: {flexDirection()};"
	>
		<!-- Panel clipper: animates size, clips content for slide effect -->
		<div
			class="flex overflow-hidden"
			class:h-full={isHorizontal}
			class:w-full={!isHorizontal}
			class:transition-all={!resize.isResizing}
			class:duration-300={!resize.isResizing}
			style="{sizeProperty}: {clipperSize}; justify-content: {clipperJustify}; flex-direction: {isHorizontal
				? 'row'
				: 'column'};"
		>
			<!-- Inner: maintains full size so content doesn't reflow during animation -->
			<div
				class="flex shrink-0"
				class:h-full={isHorizontal}
				class:w-full={!isHorizontal}
				style="{sizeProperty}: max({resize.currentSize}, {defaultMinSize}); flex-direction: {flexDirection()};"
			>
				<!-- Sidebar panel -->
				<aside
					bind:this={sidebarElement}
					class="relative z-20 flex shrink-0 bg-sidebar text-sidebar-foreground shadow-lg"
					class:flex-col={isHorizontal}
					class:flex-row={!isHorizontal}
					class:h-full={isHorizontal}
					class:w-full={!isHorizontal}
					class:border-r={position === SidebarPosition.LEFT}
					class:border-l={position === SidebarPosition.RIGHT}
					class:border-b={position === SidebarPosition.TOP}
					class:border-t={position === SidebarPosition.BOTTOM}
					class:border-sidebar-border={true}
					style="{sizeProperty}: {resize.currentSize}; {isHorizontal
						? 'min-width'
						: 'min-height'}: {defaultMinSize};"
				>
					<div
						class="flex overflow-hidden"
						class:flex-col={isHorizontal}
						class:flex-row={!isHorizontal}
						class:h-full={isHorizontal}
						class:w-full={!isHorizontal}
					>
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

				<!-- Resize handle -->
				{#if isOpen}
					<Button
						class="z-40 flex shrink-0 items-center justify-center border-0 bg-transparent p-0 shadow-none ring-0 outline-none hover:!bg-primary/50 focus-visible:ring-0 {isHorizontal
							? 'cursor-ew-resize'
							: 'cursor-ns-resize'} {position === SidebarPosition.LEFT
							? '-ml-[6px]'
							: position === SidebarPosition.RIGHT
								? '-mr-[6px]'
								: position === SidebarPosition.TOP
									? '-mt-[6px]'
									: '-mb-[6px]'}"
						onpointerdown={resize.startResize}
						aria-label="Resize sidebar by dragging"
						style="{toInlineStyles(
							handleStyles()
						)}; outline: none !important; box-shadow: none !important; border: none !important;"
					/>
				{/if}
			</div>
		</div>
	</div>

	<!-- Toggle button: absolutely positioned at the top-right edge of the wrapper,
	     floats over adjacent content so there is no white strip. -->
	{#if !hideToggleButton}
		<Tooltip.Provider disableHoverableContent>
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<Button
							{...tooltipProps}
							onclick={onToggle}
							variant="default"
							size="icon"
							class="cursor-pointer absolute top-0 z-10 inline-flex size-7 items-center justify-center overflow-hidden rounded-md bg-background shadow-none outline-hidden select-none hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
							style="{position === SidebarPosition.LEFT
								? 'right: 0; transform: translateX(calc(100% - 4px));'
								: position === SidebarPosition.RIGHT
									? 'left: 0; transform: translateX(calc(-100% + 4px));'
									: position === SidebarPosition.TOP
										? 'bottom: 0; right: 0; transform: translateY(calc(100% - 4px));'
										: 'top: 0; right: 0; transform: translateY(calc(-100% + 4px));'} transform-origin: top left;"
							aria-label={isOpen ? 'Collapse sidebar' : 'Open sidebar'}
							aria-expanded={isOpen}
						>
							{#if isOpen}
								{@const Icon = closeIcon()}
								<Icon class="h-6 w-6 text-primary cursor-pointer" aria-hidden="true" />
							{:else}
								{@const OpenIcon = openIcon}
								<OpenIcon class="h-6 w-6 text-primary cursor-pointer" aria-hidden="true" />
							{/if}
						</Button>
					{/snippet}
				</Tooltip.Trigger>

				<Tooltip.Content side="bottom">
					<p>{isOpen ? 'Collapse' : 'Expand'}</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	{/if}
</div>

<style>
	/*
		Responsive defaults (no config passed).
		Breakpoints map to the previous `mainSidebarSizes`:
		- >= 1280px: 700px / 500px
		- >= 1024px: 500px / 250px
		- >= 768px:  400px / 200px
		Below 768px, it continues using 400px / 200px unless overridden elsewhere.
	*/
	.dsh-sidebar {
		--dsh-sidebar-original-size: 500px;
		--dsh-sidebar-min-size: 500px;
	}

	@media (min-width: 1024px) {
		.dsh-sidebar {
			--dsh-sidebar-original-size: 500px;
			--dsh-sidebar-min-size: 500px;
		}
	}

	@media (min-width: 1280px) {
		.dsh-sidebar {
			--dsh-sidebar-original-size: 700px;
			--dsh-sidebar-min-size: 500px;
		}
	}

	/* Ensure CSS min-size applies even when resizing via inline width/height. */
	.dsh-sidebar.is-horizontal aside {
		min-width: var(--dsh-sidebar-min-size);
	}

	.dsh-sidebar:not(.is-horizontal) aside {
		min-height: var(--dsh-sidebar-min-size-vertical, 100px);
	}
</style>
