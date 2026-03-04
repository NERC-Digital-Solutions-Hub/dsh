<script lang="ts">
	import * as Tabs from '$lib/Components/shadcn/tabs/index.js';
	import { TabProgress } from '$lib/Types/Uprn.types';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import type { Component, Snippet } from 'svelte';
	import { CircleDashed, CircleDot, CircleCheckBig } from '@lucide/svelte';
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';

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
		/** Optional progress state for the tab trigger. */
		hasProgress?: boolean;
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

	/**
	 * Generates a title for the progress state of a tab trigger.
	 * @param progress - The progress state of the tab trigger.
	 * @returns A string title representing the progress state, or undefined if no progress is provided
	 */
	function getTitleForProgress(progress: TabProgress | undefined): string | undefined {
		switch (progress) {
			case TabProgress.NotStarted:
				return 'Not Started';
			case TabProgress.InProgress:
				return 'In Progress';
			case TabProgress.Completed:
				return 'Completed';
		}
		return undefined;
	}
</script>

<Tabs.Root {value} {onValueChange} class="flex h-full w-full flex-col">
	<div class="tab-list-wrapper flex-shrink-0">
		<Tabs.List class="tab-list">
			{#each triggersWithProgress as { value, label, seperatorIcon, tooltip, progress, hasProgress }}
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Tabs.Trigger {value} class="tab-trigger">
								{@const progressValue = !progress ? TabProgress.NotStarted : progress}
								{#if progressValue && (hasProgress == undefined || hasProgress)}
									<span class="text-xs text-muted-foreground">
										{#if progressValue === TabProgress.NotStarted}
											<CircleDashed class="inline-block h-4 w-4" />
										{:else if progressValue === TabProgress.InProgress}
											<CircleDot class="inline-block h-4 w-4 text-amber-600" />
										{:else if progressValue === TabProgress.Completed}
											<CircleCheckBig class="inline-block h-4 w-4 text-green-800" />
										{/if}
									</span>
								{/if}
								{label}
							</Tabs.Trigger>
						</Tooltip.Trigger>
						<Tooltip.Portal>
							<Tooltip.Content>
								<p>
									{tooltip}
									{#if progress}({getTitleForProgress(progress)}){/if}
								</p>
							</Tooltip.Content>
						</Tooltip.Portal>
					</Tooltip.Root>
				</Tooltip.Provider>
				{#if value !== triggers[triggers.length - 1]?.value}
					{#if seperatorIcon}
						{@const SeparatorIcon = seperatorIcon}
						<SeparatorIcon class="separator" />
					{:else}
						<ChevronRightIcon class="separator" />
					{/if}
				{/if}
			{/each}
			{@render children?.()}
		</Tabs.List>
	</div>
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
</style>
