<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Menu, X } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';

	type Props = {
		isOpen: boolean;
		onToggle: () => void;
		children?: Snippet;
		minWidth?: string;
	};

	const { isOpen, onToggle, children, minWidth = '500px' }: Props = $props();

	let sidebarElement: HTMLElement;
	let sidebarWidth = $state(0);
	let currentWidth = $state(parseFloat(minWidth));
	let isResizing = $state(false);
	// Width of the visible resize handle (px) - reserve content padding to avoid collision with scrollbar
	let handleWidth = $state(8);

	// Parse min width to number
	const minWidthPx = $derived(parseFloat(minWidth));

	onMount(() => {
		if (!sidebarElement) return;

		// Use ResizeObserver to continuously track sidebar width
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				sidebarWidth = entry.contentRect.width;
			}
		});

		resizeObserver.observe(sidebarElement);

		// Cleanup
		return () => {
			resizeObserver.disconnect();
		};
	});

	function startResize(e: MouseEvent) {
		if (!isOpen) return;
		isResizing = true;
		e.preventDefault();

		const startX = e.clientX;
		const startWidth = currentWidth;

		function onMouseMove(e: MouseEvent) {
			const delta = e.clientX - startX;
			const newWidth = Math.max(minWidthPx, startWidth + delta);
			currentWidth = newWidth;
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
		document.body.style.cursor = 'ew-resize';
		document.body.style.userSelect = 'none';
	}
</script>

<!-- Toggle button that moves with sidebar -->
<Button
	onclick={onToggle}
	variant="default"
	size="icon"
	class="fixed z-[2] rounded-l-none rounded-r-md shadow-lg hover:scale-105"
	style="top: calc(var(--header-height, 64px) + 1rem); left: {sidebarWidth}px; pointer-events: auto; transition: transform 200ms, background-color 200ms;"
	aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
	aria-expanded={isOpen}
>
	{#if isOpen}
		<X class="h-6 w-6" />
	{:else}
		<Menu class="h-6 w-6" />
	{/if}
</Button>

<!-- Sidebar -->
<aside
	bind:this={sidebarElement}
	class="relative flex h-full flex-col border-r border-sidebar-border bg-card text-card-foreground shadow-lg ease-in-out"
	class:transition-all={!isResizing}
	class:duration-300={!isResizing}
	style="width: {isOpen ? `${currentWidth}px` : '0'}; overflow: hidden;"
>
	<div class="flex h-full w-full flex-col">
		<!-- Content -->
		<div
			class="flex-1 overflow-x-hidden overflow-y-auto p-4"
			style="padding-right: {handleWidth + 8}px;"
		>
			{#if children}
				{@render children()}
			{/if}
		</div>
	</div>

	<!-- Resize handle -->
	{#if isOpen}
		<button
			class="absolute top-0 h-full cursor-ew-resize border-0 bg-transparent p-0 transition-colors hover:bg-primary/50"
			onmousedown={startResize}
			aria-label="Resize sidebar by dragging"
			tabindex="-1"
			style="width: {handleWidth}px; right: {-handleWidth / 2 + 'px'};"
		></button>
	{/if}
</aside>
