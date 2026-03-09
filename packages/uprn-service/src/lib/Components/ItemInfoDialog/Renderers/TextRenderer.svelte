<script lang="ts">
	type Props = {
		content: string;
	};

	let { content }: Props = $props();
</script>

<p class="w-full max-w-prose self-stretch whitespace-pre-wrap text-sm leading-relaxed">
	{content}
</p>
