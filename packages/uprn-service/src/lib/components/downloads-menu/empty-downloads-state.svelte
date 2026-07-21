<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		class?: string;
	};

	const { class: className }: Props = $props();
</script>

<p class={cn('m-0 text-sm italic text-gray-400', className)}>No downloads in queue</p>
