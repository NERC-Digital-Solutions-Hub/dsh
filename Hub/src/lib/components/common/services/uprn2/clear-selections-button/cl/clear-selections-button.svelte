<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Trash } from 'lucide-svelte';

	type Props = {
		clear: () => void;
	};

	const { clear }: Props = $props();
</script>

<Button onclick={() => clear()} variant="destructive" class="size-7" title="Clear all selections">
	<Trash />
</Button>
