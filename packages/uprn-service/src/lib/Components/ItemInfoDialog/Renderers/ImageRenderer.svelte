<script lang="ts">
	import { Lightbox } from 'svelte-lightbox';

	type Props = {
		content: string;
		index: number;
	};

	let { content, index }: Props = $props();
</script>

<Lightbox imagePreset="scroll" enableImageExpand={true}>
	<img
		src={content}
		alt={`Metadata image ${index + 1}`}
		class="mx-auto max-h-[420px] w-auto cursor-zoom-in rounded-md object-contain"
	/>
</Lightbox>
