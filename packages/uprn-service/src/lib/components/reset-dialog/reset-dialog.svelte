<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/shadcn/button/index.js';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { RotateCcw } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	type Props = {
		onReset: () => void;
		buttonClass?: string;
		open?: boolean;
	};

	let { onReset, buttonClass, open = $bindable(false) }: Props = $props();

	function handleConfirm() {
		onReset();
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger title="Reset" class={cn(buttonVariants({ variant: 'outline' }), buttonClass)}>
		<RotateCcw />
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Are you sure?</Dialog.Title>
			<Dialog.Description
				>This action will clear all current selections. This cannot be undone.</Dialog.Description
			>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="destructive" onclick={handleConfirm}>Reset</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
