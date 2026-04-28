<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Card from '$lib/Components/shadcn/card/index.js';
	import Button from '$lib/Components/shadcn/button/button.svelte';
	import { cn } from '$lib/utils.js';
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';

	import { ChevronDown, ChevronUp, Maximize, Minimize } from '@lucide/svelte';

	type Props = {
		isOpenedOnInit?: boolean;
		class?: string;
		children?: Snippet;
	};

	const { isOpenedOnInit = false, class: className, children }: Props = $props();
	let isInitialised = false;
	let isOpened = $state<boolean>(false);
	let isMaximised = $state<boolean>(false);
	let canAnimate = $state<boolean>(false);

	const collapsedHeight = '45px';
	const normalHeight = '300px';
	let lastExpandedHeight = normalHeight;
	let currentHeight = $state<string>(collapsedHeight);

	$effect(() => {
		if (isInitialised) return;
		isInitialised = true;

		if (isOpenedOnInit) {
			isOpened = true;
			currentHeight = normalHeight;
		}

		requestAnimationFrame(() => {
			canAnimate = true;
		});
	});

	function onToggleCollapse() {
		isOpened = !isOpened;
		isMaximised = false;
		if (isOpened) {
			currentHeight = lastExpandedHeight;
		} else {
			currentHeight = collapsedHeight;
		}
	}

	function onToggleMaximise() {
		isMaximised = !isMaximised;
		if (isMaximised) {
			lastExpandedHeight = currentHeight;
			currentHeight = '100%';
		} else {
			currentHeight = lastExpandedHeight;
		}
	}
</script>

<div
	class={cn(className)}
	style="height: {currentHeight}; overflow: hidden;{canAnimate
		? ' transition: height 0.15s ease-in-out;'
		: ''}"
>
	<Card.Root
		class="h-full w-full rounded-tl-md rounded-tr-md rounded-br-none rounded-bl-none gap-0 py-0 pt-0 pb-0 border-0 border-t border-t-border"
	>
		<Card.Header class="pt-2">
			<div class="flex w-full items-center justify-between">
				<div class="font-medium">Chat</div>
				<div class="flex gap-1">
					{#if isOpened}
						<Tooltip.Provider disableHoverableContent>
							<Tooltip.Root>
								<Tooltip.Trigger>
									{#snippet child({ props: tooltipProps })}
										<Button
											{...tooltipProps}
											type="button"
											class="size-11 border bg-background hover:bg-accent focus-visible:border-ring"
											onclick={onToggleMaximise}
											aria-label={isMaximised ? 'Compact view' : 'Expand view'}
										>
											{#if isMaximised}
												<Minimize class="size-4 text-primary" aria-hidden="true" />
											{:else}
												<Maximize class="size-4 text-primary" aria-hidden="true" />
											{/if}
										</Button>
									{/snippet}
								</Tooltip.Trigger>

								<Tooltip.Content>
									<p>{isMaximised ? 'Compact view' : 'Expand view'}</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					{/if}
					<Tooltip.Provider disableHoverableContent>
						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props: tooltipProps })}
									<Button
										{...tooltipProps}
										type="button"
										class="size-11 border bg-background hover:bg-accent focus-visible:border-ring"
										onclick={onToggleCollapse}
										aria-label={isOpened ? 'Hide panel' : 'Open panel'}
										aria-expanded={isOpened}
									>
										{#if !isOpened}
											<ChevronUp class="size-4 text-primary" aria-hidden="true" />
										{:else}
											<ChevronDown class="size-4 text-primary" aria-hidden="true" />
										{/if}
									</Button>
								{/snippet}
							</Tooltip.Trigger>

							<Tooltip.Content>
								<p>{isOpened ? 'Hide panel' : 'Open panel'}</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				</div>
			</div>
		</Card.Header>
		<Card.Content class="h-full min-h-[10px] w-full p-0">
			{@render children?.()}
		</Card.Content>
	</Card.Root>
</div>
