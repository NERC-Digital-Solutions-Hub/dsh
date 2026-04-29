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
		separatorIcon?: Component;
		/** Optional progress state for the tab trigger. */
		hasProgress?: boolean;
	};

	/**
	 * Props for the UPRNTabBar component.
	 */
	type Props = {
		/** Array of trigger definitions for the tabs. */
		triggers?: TriggerDefinition[];
		/** Optional mapping of tab values to their progress states. */
		progressByValue?: Record<string, TabProgress | undefined>;
		/** Optional action controls shown beside the tab list. */
		actions?: Snippet;
	};

	const { triggers = [], progressByValue = {}, actions }: Props = $props();

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

<div class="tab-list-wrapper flex-shrink-0">
	<div class="tabbar-shell">
		<Tooltip.Provider disableHoverableContent>
			<Tabs.List class="tab-list">
				{#each triggersWithProgress as { value, label, separatorIcon, tooltip, progress, hasProgress }}
					{@const isLastTrigger = value === triggers[triggers.length - 1]?.value}
					{@const SeparatorIcon = separatorIcon ?? ChevronRightIcon}
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Tabs.Trigger {...props} {value} class="tab-trigger">
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
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content side="bottom">
							<p>
								{tooltip}
								{#if progress}({getTitleForProgress(progress)}){/if}
							</p>
						</Tooltip.Content>
					</Tooltip.Root>
					{#if !isLastTrigger}
						<span class="separator-container" role="presentation" aria-hidden="true">
							<SeparatorIcon class="separator" aria-hidden="true" />
						</span>
					{/if}
				{/each}
			</Tabs.List>
		</Tooltip.Provider>

		{#if actions}
			|
			<div class="tab-actions">
				{@render actions()}
			</div>
		{/if}
	</div>
</div>

<style>
	.tab-list-wrapper {
		display: inline-flex;
		justify-content: center;
		max-width: 100%;
		padding: 0.75rem 0;
	}

	.tabbar-shell {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem;
		max-width: 100%;
		padding-right: 0.5rem;
	}

	:global(.tab-list) {
		background: transparent;
		border: none;
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
		gap: 0.375rem;
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

	.separator-container {
		color: #6b7280;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 1rem;
		opacity: 1;
		pointer-events: none;
		width: 1rem;
		flex: 0 0 1rem;
	}

	.separator-container :global(.separator) {
		color: #6b7280;
		display: block;
		height: 0.875rem;
		opacity: 1;
		flex-shrink: 0;
		width: 0.875rem;
	}

	.tab-actions {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
</style>
