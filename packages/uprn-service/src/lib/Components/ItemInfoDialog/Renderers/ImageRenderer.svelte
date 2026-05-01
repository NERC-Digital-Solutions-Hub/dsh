<script lang="ts">
	import * as Dialog from '$lib/Components/shadcn/dialog/index.js';
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';
	import { X, ZoomIn, ZoomOut } from '@lucide/svelte';

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'image' }>;
		index?: number;
	};

	let { content, index = 0 }: Props = $props();

	let isOpen = $state(false);
	let scale = $state(1);
	let translateX = $state(0);
	let translateY = $state(0);
	let isDragging = $state(false);

	let viewerElement: HTMLDivElement | null = $state(null);
	let imageElement: HTMLImageElement | null = $state(null);

	let dragStartX = 0;
	let dragStartY = 0;
	let dragStartTranslateX = 0;
	let dragStartTranslateY = 0;

	const altText = $derived(`Metadata image ${index + 1}`);
	const imageTransform = $derived(
		`translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`
	);
	const viewerCursorClass = $derived(
		isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'
	);

	const minScale = 1;
	const maxScale = 6;
	const zoomStep = 1.35;

	function openViewer() {
		isOpen = true;
		resetTransform();
	}

	function closeViewer() {
		isOpen = false;
		isDragging = false;
		resetTransform();
	}

	function resetTransform() {
		scale = 1;
		translateX = 0;
		translateY = 0;
	}

	function clamp(value: number, min: number, max: number) {
		return Math.min(Math.max(value, min), max);
	}

	function clampTranslation(x: number, y: number, nextScale = scale) {
		if (!viewerElement || !imageElement || nextScale <= 1) {
			return { x: 0, y: 0 };
		}

		const maxX = Math.max(
			0,
			(imageElement.offsetWidth * nextScale - viewerElement.clientWidth) / 2
		);
		const maxY = Math.max(
			0,
			(imageElement.offsetHeight * nextScale - viewerElement.clientHeight) / 2
		);

		return {
			x: clamp(x, -maxX, maxX),
			y: clamp(y, -maxY, maxY)
		};
	}

	function zoomTo(nextScale: number, originX: number, originY: number) {
		const normalizedScale = nextScale < 1.02 ? 1 : nextScale;
		const scaleRatio = normalizedScale / scale;

		const nextTranslateX = translateX + (1 - scaleRatio) * (originX - translateX);
		const nextTranslateY = translateY + (1 - scaleRatio) * (originY - translateY);
		const clamped = clampTranslation(nextTranslateX, nextTranslateY, normalizedScale);

		scale = normalizedScale;
		translateX = clamped.x;
		translateY = clamped.y;
	}

	function zoomFromCenter(multiplier: number) {
		zoomTo(clamp(scale * multiplier, minScale, maxScale), 0, 0);
	}

	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		event.stopPropagation();

		if (!viewerElement) {
			return;
		}

		const rect = viewerElement.getBoundingClientRect();
		const pointerX = event.clientX - rect.left - rect.width / 2;
		const pointerY = event.clientY - rect.top - rect.height / 2;
		const nextScale = clamp(scale * Math.exp(-event.deltaY * 0.0015), minScale, maxScale);

		zoomTo(nextScale, pointerX, pointerY);
	}

	function handlePointerDown(event: PointerEvent) {
		if (scale <= 1 || event.button !== 0) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		isDragging = true;
		dragStartX = event.clientX;
		dragStartY = event.clientY;
		dragStartTranslateX = translateX;
		dragStartTranslateY = translateY;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isDragging) {
			return;
		}

		event.preventDefault();

		const clamped = clampTranslation(
			dragStartTranslateX + event.clientX - dragStartX,
			dragStartTranslateY + event.clientY - dragStartY
		);

		translateX = clamped.x;
		translateY = clamped.y;
	}

	function handlePointerUp(event: PointerEvent) {
		if (!isDragging) {
			return;
		}

		isDragging = false;
		(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
	}

	function handleOpenChange(open: boolean) {
		isOpen = open;
		isDragging = false;
		resetTransform();
	}
</script>

<button
	type="button"
	class="mx-auto block cursor-zoom-in rounded-md"
	aria-label={`Open ${altText}`}
	onclick={openViewer}
>
	<img src={content.url} alt={altText} class="max-h-[420px] w-auto rounded-md object-contain" />
</button>

<Dialog.Root bind:open={isOpen} onOpenChange={handleOpenChange}>
	<Dialog.Content
		class="z-[10050] h-[calc(90dvh-2rem)] w-[calc(80vw-2rem)] max-w-none overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-none"
		showCloseButton={false}
		interactOutsideBehavior="ignore"
		aria-label={altText}
	>
		<div
			class="relative flex h-full w-full overflow-hidden rounded-lg bg-slate-50 p-4 shadow-2xl ring-1 ring-black/10"
		>
			<div class="absolute right-4 top-4 z-10 flex gap-2">
				<button
					type="button"
					class="flex size-9 items-center justify-center rounded-md bg-white/95 text-gray-900 shadow-sm ring-1 ring-black/10 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
					aria-label="Zoom out"
					disabled={scale <= minScale}
					onclick={() => zoomFromCenter(1 / zoomStep)}
				>
					<ZoomOut class="size-5" aria-hidden="true" />
				</button>

				<button
					type="button"
					class="flex size-9 items-center justify-center rounded-md bg-white/95 text-gray-900 shadow-sm ring-1 ring-black/10 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
					aria-label="Zoom in"
					disabled={scale >= maxScale}
					onclick={() => zoomFromCenter(zoomStep)}
				>
					<ZoomIn class="size-5" aria-hidden="true" />
				</button>

				<button
					type="button"
					class="flex size-9 items-center justify-center rounded-md bg-white/95 text-gray-900 shadow-sm ring-1 ring-black/10 hover:bg-white"
					aria-label="Close image viewer"
					onclick={closeViewer}
				>
					<X class="size-5" aria-hidden="true" />
				</button>
			</div>

			<div
				bind:this={viewerElement}
				class={`flex h-full w-full ${viewerCursorClass} touch-none select-none items-center justify-center overflow-hidden`}
				onwheel={handleWheel}
				onpointerdown={handlePointerDown}
				onpointermove={handlePointerMove}
				onpointerup={handlePointerUp}
				onpointercancel={handlePointerUp}
			>
				<img
					bind:this={imageElement}
					src={content.url}
					alt={altText}
					draggable="false"
					class="max-h-full max-w-full rounded-md bg-white object-contain shadow-2xl ring-1 ring-black/10 will-change-transform"
					style:transform={imageTransform}
				/>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
