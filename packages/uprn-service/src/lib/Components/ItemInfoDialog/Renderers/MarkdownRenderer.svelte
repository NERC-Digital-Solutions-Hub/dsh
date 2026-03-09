<script lang="ts">
	type Props = {
		content: string;
	};

	let { content }: Props = $props();
</script>

<a href={content} target="_blank" rel="noreferrer" class="text-sm underline">Open PDF</a>
