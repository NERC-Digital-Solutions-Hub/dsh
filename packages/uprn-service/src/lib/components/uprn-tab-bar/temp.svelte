<!-- <script lang="ts">
	import * as Tabs from '$lib/components/shadcn/tabs/index.js';
	import { TabProgress } from '$lib/types/uprn';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import type { Component, Snippet } from 'svelte';
	import { CircleDashed, CircleDot, CircleCheckBig } from '@lucide/svelte';

	/**
	 * Definition for a tab trigger.
	 */
	type TriggerDefinition = {
		/** The value of the tab trigger. */
		value: string;
		/** The label to display for the tab trigger. */
		label: string;
		/** Optional tooltip text for the tab trigger. */
		tooltip?: string;
		/** Optional separator icon component for the tab triggers. If not provided, the ChevronRightIcon will be used. */
		seperatorIcon?: Component;
	};

	/**
	 * Props for the UPRNTabBar component.
	 */
	type Props = {
		/** The currently selected tab value. */
		value?: string;
		/** Array of trigger definitions for the tabs. */
		triggers?: TriggerDefinition[];
		/** Optional mapping of tab values to their progress states. */
		progressByValue?: Record<string, TabProgress | undefined>;
		/** Callback function when the tab value changes. */
		onValueChange?: (value: string) => void;
		/** Optional children snippet for the tab content. */
		children?: Snippet;
	};

	const { value, triggers = [], progressByValue = {}, onValueChange, children }: Props = $props();

	const triggersWithProgress = $derived.by(() =>
		triggers.map((t) => ({
			...t,
			progress: progressByValue[t.value]
		}))
	);

	// Track tabs the user has actually selected (visited)
	let visitedByValue = $state<Record<string, boolean>>({});

	// Which tab (value) should currently pulse
	let pulseTarget = $state<string | null>(null);

	// Keep a previous snapshot of progress so we can detect "became Completed"
	let prevProgress: Record<string, TabProgress | undefined> = {};
	// Mark visited on selection changes, and stop pulsing if they selected the pulsing tab
	$effect(() => {
		const v = value;
		if (!v) return;

		visitedByValue[v] = true;

		if (pulseTarget === v) {
			pulseTarget = null;
		}
	});

	$effect(() => {
		const list = triggers;
		if (list.length === 0) return;

		for (let i = 0; i < list.length; i++) {
			const tabValue = list[i]!.value;

			const prev = prevProgress[tabValue] ?? TabProgress.NotStarted;
			const curr = progressByValue[tabValue] ?? TabProgress.NotStarted;

			if (prev !== TabProgress.Completed && curr === TabProgress.Completed) {
				const next = list[i + 1]?.value;
				if (next && !visitedByValue[next] && value !== next) {
					if (pulseTarget !== next) pulseTarget = next; // avoid needless sets
				}
			}
		}

		// update snapshot without triggering reactivity
		prevProgress = { ...progressByValue };
	});
</script>

<Tabs.Root {value} {onValueChange} class="flex h-full w-full flex-col">
	<div class="tab-list-wrapper flex-shrink-0">
		<Tabs.List class="tab-list">
			{#each triggersWithProgress as trigger (trigger.value)}
				<Tabs.Trigger
					value={trigger.value}
					class={{
						'tab-trigger': true,
						pulse: pulseTarget === trigger.value
					}}
					title={trigger.tooltip}
				>
					<span class="mr-2 text-xs text-muted-foreground">
						{#if trigger.progress === TabProgress.NotStarted}
							<CircleDashed class="inline-block h-4 w-4" />
						{:else if trigger.progress === TabProgress.InProgress}
							<CircleDot class="inline-block h-4 w-4" />
						{:else if trigger.progress === TabProgress.Completed}
							<CircleCheckBig class="inline-block h-4 w-4" />
						{/if}
					</span>

					{trigger.label}
				</Tabs.Trigger>

				{#if trigger.value !== triggersWithProgress[triggersWithProgress.length - 1]?.value}
					{#if trigger.seperatorIcon}
						{@const SeparatorIcon = trigger.seperatorIcon}
						<SeparatorIcon class="separator" />
					{:else}
						<ChevronRightIcon class="separator" />
					{/if}
				{/if}
			{/each}
		</Tabs.List>
	</div>
	{@render children?.()}
</Tabs.Root>

<style>
	.tab-list-wrapper {
		display: flex;
		justify-content: center;
		width: 100%;
		padding: 0.75rem 0;
	}

	:global(.tab-list) {
		background: white;
		border: 1px solid #e5e7eb;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		height: 2.5rem;
	}

	:global(.tab-trigger) {
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		padding: 0.5rem 0.75rem;
		color: #6b7280;
		font-weight: 500;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		height: 2rem;
		min-width: fit-content;
		display: flex;
		align-items: center;
	}

	:global(.tab-trigger:hover),
	:global(.tab-trigger[data-state='active']) {
		color: #111827;
	}

	:global(.tab-trigger:hover) {
		background: #f9fafb;
	}

	:global(.tab-trigger[data-state='active']) {
		background: #f3f4f6;
		box-shadow: none !important;
	}

	:global(.separator) {
		color: #6b7280;
		width: 0.875rem;
		height: 0.875rem;
		flex-shrink: 0;
	}

	:global(.tab-trigger.pulse) {
		animation: tab-pulse 900ms ease-in-out infinite;
		transform-origin: center;
	}

	@keyframes tab-pulse {
		0% {
			transform: scale(1);
		}
		45% {
			transform: scale(1.08);
		}
		70% {
			transform: scale(0.98);
		}
		100% {
			transform: scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.tab-trigger.pulse) {
			animation: none;
		}
	}
</style> -->
