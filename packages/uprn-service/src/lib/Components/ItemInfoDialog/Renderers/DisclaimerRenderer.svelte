<script lang="ts">
	type Props = {
		content: string;
	};

	let { content }: Props = $props();
</script>

<p class="text-sm italic text-muted-foreground">Disclaimer: {content}</p>
