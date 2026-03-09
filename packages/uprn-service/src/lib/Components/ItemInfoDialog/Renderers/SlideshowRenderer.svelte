<script lang="ts">
	import * as Carousel from '$lib/Components/shadcn/carousel/index.js';
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';
	import { GalleryImage, GalleryThumbnail, LightboxGallery } from 'svelte-lightbox';

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'slideshow' }>;
	};

	let { content }: Props = $props();
</script>

<LightboxGallery enableImageExpand={true}>
	<div slot="thumbnail" class="mx-auto w-full max-w-[520px]">
		<Carousel.Root>
			<Carousel.Content>
				{#each content.urls as imageUrl, imageIndex}
					<Carousel.Item class="flex justify-center">
						<GalleryThumbnail id={imageIndex}>
							<img
								src={imageUrl}
								alt={`Slideshow image ${imageIndex + 1}`}
								class="mx-auto max-h-[320px] w-auto cursor-zoom-in rounded-md object-contain"
							/>
						</GalleryThumbnail>
					</Carousel.Item>
				{/each}
			</Carousel.Content>

			<Carousel.Previous class="-start-8" />
			<Carousel.Next class="-end-8" />
		</Carousel.Root>
	</div>

	{#each content.urls as imageUrl, imageIndex}
		<GalleryImage title={`Image ${imageIndex + 1}`}>
			<img src={imageUrl} alt={`Slideshow image ${imageIndex + 1}`} />
		</GalleryImage>
	{/each}
</LightboxGallery>
