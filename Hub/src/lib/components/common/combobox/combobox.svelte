<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import * as ScrollArea from '$lib/components/ui/scroll-area';
	import { Check, ChevronsUpDown, X } from 'lucide-svelte';

	interface ComboboxOption {
		value: string;
		label: string;
		disabled?: boolean;
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
		className = ''
	}: Props = $props();

	let open = $state(false);
	let searchValue = $state('');

	const selectedSet = $derived(new Set(selectedValues));
	const canAddMore = $derived(!maxSelections || selectedValues.length < maxSelections);

	// Get labels for selected values
	const selectedLabels = $derived(
		selectedValues
			.map((value) => options.find((opt) => opt.value === value)?.label)
			.filter(Boolean) as string[]
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
			if (onDeselect) {
				onDeselect(value);
			}
		} else {
			// Select if we haven't reached max
			if (canAddMore) {
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
				<span class="truncate">{displayText}</span>
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
									disabled={option.disabled || (!selectedSet.has(option.value) && !canAddMore)}
								>
									<Check
										class="mr-2 h-4 w-4 {selectedSet.has(option.value)
											? 'opacity-100'
											: 'opacity-0'}"
									/>
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
	{#if selectedValues.length > 0}
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
