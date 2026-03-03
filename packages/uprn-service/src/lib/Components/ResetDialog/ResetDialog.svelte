<script lang="ts">
	import { Button, buttonVariants } from '$lib/Components/shadcn/button/index.js';
	import * as Dialog from '$lib/Components/shadcn/dialog/index.js';
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';
	import { cn } from '$lib/utils';
	import { RotateCcw } from '@lucide/svelte';

	export type ResetAction = {
		label: string;
		description: string;
		onReset: () => void;
	};

	type Props = {
		actions: ResetAction[];
		buttonClass?: string;
		open?: boolean;
	};

	let { actions, buttonClass, open = $bindable(false) }: Props = $props();

	function handleAction(action: ResetAction) {
		action.onReset();
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class={cn(buttonVariants({ variant: 'outline' }), buttonClass)}>
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<RotateCcw />
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Reset options</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Reset Options</Dialog.Title>
			<Dialog.Description>Choose what to reset. These actions cannot be undone.</Dialog.Description>
		</Dialog.Header>
		<div class="flex flex-col gap-2 py-2">
			{#each actions as action (action.label)}
				<Button
					variant="outline"
					class="h-auto w-full justify-start gap-3 px-4 py-3 text-left"
					onclick={() => handleAction(action)}
				>
					<div class="flex flex-col items-start">
						<span class="text-sm font-medium">{action.label}</span>
						<span class="text-xs text-muted-foreground">{action.description}</span>
					</div>
				</Button>
			{/each}
		</div>
		<Dialog.Footer class="sm:justify-end">
			<Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
