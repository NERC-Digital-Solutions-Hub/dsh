<script lang="ts">
	import { Button } from '$lib/components/shadcn/button';
	import * as Command from '$lib/components/shadcn/command';
	import * as Popover from '$lib/components/shadcn/popover';
	import * as ScrollArea from '$lib/components/shadcn/scroll-area';
	import type { Component } from 'svelte';
	import { ChevronsUpDown, X } from '@lucide/svelte';

	interface ComboboxOption {
		value: string;
		label: string;
		disabled?: boolean;
		icon?: Component;
	}

	interface Props {
		options: ComboboxOption[];
		selectedValues?: string[];
		placeholder?: string;
		searchPlaceholder?: string;
		emptyText?: string;
		onSelect: (value: string) => void;
		onDeselect?: (value: string) => void;
		maxSelections?: number;
		disabled?: boolean;
		className?: string;
		showSelectedBadges?: boolean;
		allowDeselectOnReselect?: boolean;
	}

	let {
		options,
		selectedValues = [],
		placeholder = 'Select options...',
		searchPlaceholder = 'Search...',
		emptyText = 'No results found.',
		onSelect,
		onDeselect,
		maxSelections,
		disabled = false,
		className = '',
		showSelectedBadges = true,
		allowDeselectOnReselect = true
	}: Props = $props();

	let open = $state(false);
	let searchValue = $state('');

	const selectedSet = $derived(new Set(selectedValues));
	const canAddMore = $derived(!maxSelections || selectedValues.length < maxSelections);
	const selectedOptions = $derived(
		selectedValues
			.map((value) => options.find((opt) => opt.value === value))
			.filter((option): option is ComboboxOption => Boolean(option))
	);
	const primarySelectedOption = $derived(selectedOptions[0] ?? null);

	// Get labels for selected values
	const selectedLabels = $derived(
		selectedOptions.map((option) => option.label)
	);

	const displayText = $derived(
		selectedValues.length === 0
			? placeholder
			: selectedValues.length === 1
				? selectedLabels[0]
				: `${selectedValues.length} selected`
	);

	function handleSelect(value: string) {
		if (selectedSet.has(value)) {
			// Deselect
			if (allowDeselectOnReselect && onDeselect) {
				onDeselect(value);
			}
		} else {
			// For single-select comboboxes, selecting another option replaces the current one.
			if (maxSelections === 1) {
				onSelect(value);
				open = false;
			} else if (canAddMore) {
				onSelect(value);
			}
		}
	}

	function removeSelection(value: string, event: Event) {
		event.stopPropagation();
		if (onDeselect) {
			onDeselect(value);
		}
	}

	function clearSearch() {
		searchValue = '';
	}
</script>

<div class="combobox-wrapper {className}">
	<Popover.Root {open}>
		<Popover.Trigger>
			<Button
				variant="outline"
				role="combobox"
				aria-expanded={open}
				class="w-full justify-between"
				{disabled}
			>
				<span class="flex min-w-0 items-center gap-2">
					{#if primarySelectedOption?.icon}
						{@const SelectedIcon = primarySelectedOption.icon}
						<SelectedIcon class="h-4 w-4 shrink-0 text-muted-foreground" />
					{/if}
					<span class="truncate">{displayText}</span>
				</span>
				<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</Button>
		</Popover.Trigger>
		<Popover.Content class="w-[var(--bits-popover-trigger-width)] p-0" align="start">
			<Command.Root>
				<Command.Input placeholder={searchPlaceholder} bind:value={searchValue} />
				<ScrollArea.ScrollArea class="h-72">
					<Command.List>
						<Command.Empty>{emptyText}</Command.Empty>
						<Command.Group>
							{#each options as option (option.value)}
								<Command.Item
									value={option.value}
									onSelect={() => handleSelect(option.value)}
									disabled={option.disabled}
									class={selectedSet.has(option.value)
										? 'bg-primary/15 text-foreground hover:!bg-primary/15 aria-selected:bg-primary/15'
										: undefined}
								>
									{#if option.icon}
										{@const OptionIcon = option.icon}
										<OptionIcon
											class="mr-2 h-4 w-4 shrink-0 {selectedSet.has(option.value)
												? 'text-foreground'
												: 'text-muted-foreground'}"
										/>
									{/if}
									<span class="truncate">{option.label}</span>
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</ScrollArea.ScrollArea>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>

	<!-- Selected items badges (optional display) -->
	{#if showSelectedBadges && selectedValues.length > 0}
		<div class="selected-items">
			{#each selectedValues as value (value)}
				{@const label = options.find((opt) => opt.value === value)?.label}
				{#if label}
					<div class="selected-badge">
						<span class="selected-label">{label}</span>
						{#if onDeselect}
							<button
								type="button"
								class="remove-button"
								onclick={(e) => removeSelection(value, e)}
								aria-label="Remove {label}"
							>
								<X class="h-3 w-3" />
							</button>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.combobox-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		max-width: 100%; /* Respect parent constraints */
	}

	.selected-items {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.selected-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background-color: hsl(var(--primary) / 0.1);
		border: 1px solid hsl(var(--primary) / 0.2);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		line-height: 1.25rem;
	}

	.selected-label {
		color: hsl(var(--primary));
	}

	.remove-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.125rem;
		background: none;
		border: none;
		cursor: pointer;
		color: hsl(var(--primary));
		opacity: 0.7;
		transition: opacity 0.2s;
		border-radius: 0.25rem;
	}

	.remove-button:hover {
		opacity: 1;
		background-color: hsl(var(--primary) / 0.1);
	}

	.remove-button:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}
</style>
