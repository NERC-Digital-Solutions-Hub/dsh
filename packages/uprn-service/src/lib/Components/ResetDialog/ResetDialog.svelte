<script lang="ts">
	import { Button, buttonVariants } from '$lib/Components/shadcn/button/index.js';
	import * as Alert from '$lib/Components/shadcn/alert/index.js';
	import * as Dialog from '$lib/Components/shadcn/dialog/index.js';
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';
	import { cn } from '$lib/utils';
	import { AlertCircleIcon, RotateCcw } from '@lucide/svelte';

	export type ResetAction = {
		label: string;
		description: string;
		variant: 'default' | 'destructive' | 'outline';
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

	function getActionButtonVariant(action: ResetAction): ResetAction['variant'] {
		return action.variant === 'destructive' ? 'outline' : action.variant;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class={cn(buttonVariants({ variant: 'outline' }), buttonClass)}>
		<Tooltip.Provider disableHoverableContent>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<RotateCcw />
				</Tooltip.Trigger>
				<Tooltip.Content side="bottom">
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
					variant={getActionButtonVariant(action)}
					class="h-auto w-full justify-start gap-3 px-4 py-3 text-left"
					onclick={() => handleAction(action)}
				>
					{#if action.variant === 'destructive'}
						<Alert.Root
							variant="destructive"
							class="w-full border-0 bg-transparent p-0 text-left shadow-none"
						>
							<AlertCircleIcon />
							<Alert.Title class="text-sm">{action.label}</Alert.Title>
							<Alert.Description class="text-xs">{action.description}</Alert.Description>
						</Alert.Root>
					{:else}
						<div class="flex flex-col items-start">
							<span class="text-sm font-medium text-foreground">{action.label}</span>
							<span class="text-xs text-muted-foreground">{action.description}</span>
						</div>
					{/if}
				</Button>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>
