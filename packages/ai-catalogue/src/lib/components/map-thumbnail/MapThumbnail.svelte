<script lang="ts">
	import { browser } from '$app/environment';
	import type { HTMLAttributes } from 'svelte/elements';
	import {
		buildMapExportRequest,
		buildOverlayRect,
		parseArcgisMapExportResponse,
		shouldUseReferenceLayer,
		type CatalogueMapBoundingBox,
		type MapExportLayerRequest,
		type MapOverlayRect
	} from '$lib/utils/map-thumbnail';

	type ThumbnailState =
		| { status: 'idle' | 'loading' | 'error' }
		| {
				status: 'ready';
				baseImageUrl: string;
				referenceImageUrl?: string;
				imageWidth: number;
				imageHeight: number;
				overlayRect: MapOverlayRect;
		  };

	type CssSize = number | string;

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		boundingBox: CatalogueMapBoundingBox | null | undefined;
		width?: CssSize;
		height?: CssSize;
		aspectRatio?: string;
		paddingRatio?: number;
		alt?: string;
	};

	let {
		boundingBox,
		width = undefined,
		height = undefined,
		aspectRatio = '1 / 1',
		paddingRatio = 0.2,
		alt = 'Map preview',
		class: className = '',
		style: styleAttribute = '',
		...rest
	}: Props = $props();

	let container: HTMLDivElement | null = $state(null);
	let measuredWidth = $state(0);
	let measuredHeight = $state(0);
	let thumbnailState = $state<ThumbnailState>({ status: 'idle' });
	let loadToken = 0;

	const inlineStyle = $derived.by(() => {
		const styles = [styleAttribute];
		const widthStyle = formatCssSize(width);
		const heightStyle = formatCssSize(height);

		if (aspectRatio) {
			styles.push(`aspect-ratio: ${aspectRatio}`);
		}

		if (widthStyle) {
			styles.push(`width: ${widthStyle}`);
		}

		if (heightStyle) {
			styles.push(`height: ${heightStyle}`);
		}

		return styles.filter(Boolean).join('; ');
	});

	$effect(() => {
		if (!browser || !container) {
			return;
		}

		const updateSize = () => {
			if (!container) {
				return;
			}

			const rect = container.getBoundingClientRect();
			const nextWidth = Math.round(rect.width);
			const nextHeight = Math.round(rect.height);

			if (nextWidth !== measuredWidth) {
				measuredWidth = nextWidth;
			}

			if (nextHeight !== measuredHeight) {
				measuredHeight = nextHeight;
			}
		};
		const resizeObserver = new ResizeObserver(updateSize);

		updateSize();
		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
		};
	});

	$effect(() => {
		if (!browser) {
			return;
		}

		const request = buildMapExportRequest({
			boundingBox,
			cssWidth: measuredWidth,
			cssHeight: measuredHeight,
			devicePixelRatio: window.devicePixelRatio,
			paddingRatio
		});

		if (!request) {
			thumbnailState = boundingBox ? { status: 'error' } : { status: 'idle' };
			return;
		}

		const controller = new AbortController();
		const currentToken = ++loadToken;

		thumbnailState = { status: 'loading' };

		async function loadThumbnail() {
			try {
				const baseLayer = request!.layers.find((layer) => layer.id === 'base');
				const referenceLayer = request!.layers.find((layer) => layer.id === 'reference');

				if (!baseLayer) {
					throw new Error('Map thumbnail base layer is not configured.');
				}

				const baseExportResponse = await fetchExportLayer(baseLayer, controller.signal);
				const overlayRect = buildOverlayRect({
					boundingBox: request!.boundingBox,
					exportExtent: baseExportResponse.extent,
					imageWidth: baseExportResponse.width,
					imageHeight: baseExportResponse.height
				});

				if (!overlayRect) {
					throw new Error('Unable to calculate map thumbnail overlay.');
				}

				let referenceImageUrl: string | undefined;

				if (referenceLayer && shouldUseReferenceLayer(baseExportResponse.scale)) {
					try {
						const referenceExportResponse = await fetchExportLayer(
							referenceLayer,
							controller.signal
						);
						referenceImageUrl = referenceExportResponse.href;
					} catch (error) {
						console.warn('Error loading map thumbnail reference layer:', error);
					}
				}

				if (!controller.signal.aborted && currentToken === loadToken) {
					thumbnailState = {
						status: 'ready',
						baseImageUrl: baseExportResponse.href,
						...(referenceImageUrl ? { referenceImageUrl } : {}),
						imageWidth: baseExportResponse.width,
						imageHeight: baseExportResponse.height,
						overlayRect
					};
				}
			} catch (error) {
				if (!controller.signal.aborted && currentToken === loadToken) {
					console.error('Error loading map thumbnail:', error);
					thumbnailState = { status: 'error' };
				}
			}
		}

		void loadThumbnail();

		return () => {
			controller.abort();
		};
	});

	function formatCssSize(value: CssSize | undefined): string | null {
		if (value === undefined) {
			return null;
		}

		return typeof value === 'number' ? `${value}px` : value;
	}

	async function fetchExportLayer(layer: MapExportLayerRequest, signal: AbortSignal) {
		const response = await fetch(layer.url, { signal });

		if (!response.ok) {
			throw new Error(`Map export failed with status ${response.status}.`);
		}

		const exportResponse = parseArcgisMapExportResponse(await response.json());

		if (!exportResponse) {
			throw new Error('Map export response was not in the expected format.');
		}

		return exportResponse;
	}
</script>

<div
	bind:this={container}
	class="map-thumbnail {className}"
	style={inlineStyle}
	aria-busy={thumbnailState.status === 'loading'}
	{...rest}
>
	{#if thumbnailState.status === 'ready'}
		<img class="map-thumbnail__image" src={thumbnailState.baseImageUrl} {alt} loading="lazy" />
		{#if thumbnailState.referenceImageUrl}
			<img
				class="map-thumbnail__image"
				src={thumbnailState.referenceImageUrl}
				alt=""
				aria-hidden="true"
				loading="lazy"
			/>
		{/if}
		<svg
			class="map-thumbnail__overlay"
			viewBox={`0 0 ${thumbnailState.imageWidth} ${thumbnailState.imageHeight}`}
			preserveAspectRatio="none"
			aria-hidden="true"
		>
			<rect
				x={thumbnailState.overlayRect.x}
				y={thumbnailState.overlayRect.y}
				width={thumbnailState.overlayRect.width}
				height={thumbnailState.overlayRect.height}
				rx="0"
				vector-effect="non-scaling-stroke"
			/>
		</svg>
	{:else if thumbnailState.status === 'error'}
		<div class="map-thumbnail__fallback" role="img" aria-label={alt}>
			<span>Map unavailable</span>
		</div>
	{:else}
		<div class="map-thumbnail__placeholder" aria-hidden="true"></div>
	{/if}
</div>

<style>
	.map-thumbnail {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: var(--map-thumbnail-min-height, 100px);
		aspect-ratio: 1 / 1;
		overflow: hidden;
		background: hsl(var(--muted));
	}

	.map-thumbnail__image,
	.map-thumbnail__overlay,
	.map-thumbnail__placeholder,
	.map-thumbnail__fallback {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.map-thumbnail__image {
		display: block;
		object-fit: cover;
	}

	.map-thumbnail__overlay {
		pointer-events: none;
	}

	.map-thumbnail__overlay rect {
		fill: rgb(220 38 38 / 0.22);
		stroke: rgb(220 38 38);
		stroke-width: 2px;
	}

	.map-thumbnail__placeholder {
		background:
			linear-gradient(90deg, transparent, hsl(var(--background) / 0.45), transparent),
			hsl(var(--muted));
		background-size: 220% 100%;
		animation: map-thumbnail-loading 1.4s ease-in-out infinite;
	}

	.map-thumbnail__fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid hsl(var(--border));
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
		font-weight: 500;
	}

	@keyframes map-thumbnail-loading {
		from {
			background-position: 180% 0;
		}

		to {
			background-position: -40% 0;
		}
	}
</style>
