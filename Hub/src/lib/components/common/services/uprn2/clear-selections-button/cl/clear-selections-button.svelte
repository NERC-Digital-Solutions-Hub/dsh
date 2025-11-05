<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Trash } from 'lucide-svelte';
	import { cn } from '$lib/utils/utils.js';

	type Props = {
		clear: () => void;
		class?: string;
	};

	const { clear, class: buttonClass }: Props = $props();
</script>

<Button
	onclick={() => clear()}
	variant="destructive"
	class={cn('size-7', buttonClass)}
	title="Clear all selections"
>
	<Trash />
</Button>
