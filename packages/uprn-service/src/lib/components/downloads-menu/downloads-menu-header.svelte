<script lang="ts">
	import { DownloadIcon } from '@lucide/svelte';

	import { cn } from '$lib/utils';

	/**
	 * Header for the downloads panel.
	 *
	 * The parent controls external spacing through `class`; this component owns only
	 * the title, icon, and optional count display.
	 */
	type Props = {
		class?: string;
		count: number;
	};

	const { class: className, count }: Props = $props();
</script>

<div class={cn('flex items-baseline justify-between gap-3', className)}>
	<div class="ml-2 flex items-center gap-2">
		<DownloadIcon size={16} class="text-gray-500" />
		<h4 class="m-0 text-base font-medium text-gray-700">Downloads</h4>
	</div>
	{#if count > 0}
		<p class="mr-2 text-xs text-muted-foreground">{count} download(s)</p>
	{/if}
</div>
