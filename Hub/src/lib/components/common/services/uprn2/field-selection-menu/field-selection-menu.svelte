<script lang="ts">
	import { dataSelectionStore, type DataSelection } from '$lib/stores/data-selection-store.svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { X } from '@lucide/svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import FieldFilterMenuStore from '$lib/stores/field-filter-menu-store.svelte';
	import InformationIcon from '$lib/assets/information.svg?raw';

	export type Props = {
		fieldFilterMenuStore: FieldFilterMenuStore;
	};

	const { fieldFilterMenuStore }: Props = $props();

	let activeFeatureLayer: __esri.FeatureLayer | null = $state<__esri.FeatureLayer | null>(null);
	let localSelectedFields: SvelteSet<string> = $state(new SvelteSet<string>());

	// Computed state for master checkbox based on local selection
	let masterCheckboxState = $derived.by(() => {
		if (!activeFeatureLayer || !activeFeatureLayer.fields) {
			return { checked: false, indeterminate: false };
		}

		const totalFields = activeFeatureLayer.fields.length;
		const selectedCount = localSelectedFields?.size || 0;

		if (selectedCount === 0) {
			return { checked: false, indeterminate: false };
		} else if (selectedCount === totalFields) {
			return { checked: true, indeterminate: false };
		} else {
			return { checked: false, indeterminate: true };
		}
	});

	$effect(() => {
		console.log('Active Layer to Filter:', fieldFilterMenuStore.ActiveLayer);
		const activeLayer = fieldFilterMenuStore.ActiveLayer as __esri.FeatureLayer;
		activeFeatureLayer = activeLayer;

		// Initialize local selected fields when active layer changes
		if (activeLayer) {
			const existingDataSelection = dataSelectionStore.DataSelections.get(activeLayer.id);
			if (existingDataSelection?.fields) {
				// Copy existing selection
				localSelectedFields = new SvelteSet([...existingDataSelection.fields]);
			} else {
				// Start with empty selection
				localSelectedFields = new SvelteSet<string>();
			}
		}
	});

	function closeModal() {
		// Apply local changes to the data store before closing
		applyChangesToDataStore();
		fieldFilterMenuStore.ActiveLayer = null;
	}

	function applyChangesToDataStore() {
		if (!activeFeatureLayer) {
			return;
		}

		let targetDataSelection = dataSelectionStore.DataSelections.get(activeFeatureLayer.id);
		if (!targetDataSelection) {
			return;
		}

		// Initialize fields if null
		if (targetDataSelection.fields === undefined || targetDataSelection.fields === null) {
			targetDataSelection.fields = new SvelteSet<string>();
		}

		if (localSelectedFields.size === 0) {
			dataSelectionStore.removeSelection(activeFeatureLayer.id);
			return;
		}

		// Clear existing selection and add all local selections
		targetDataSelection.fields.clear();
		localSelectedFields.forEach((fieldName) => {
			targetDataSelection.fields?.add(fieldName);
		});
	}

	function handleBackdropClick(event: MouseEvent) {
		// Close modal only if clicking the backdrop, not the card content
		// Backdrop click cancels changes
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}

	function toggleFieldSelection(fieldName: string) {
		if (!activeFeatureLayer) {
			return;
		}

		// Work with local state instead of directly modifying data store
		if (localSelectedFields.has(fieldName)) {
			localSelectedFields.delete(fieldName);
		} else {
			localSelectedFields.add(fieldName);
		}
	}

	function handleMasterCheckboxClick() {
		if (!activeFeatureLayer?.fields) {
			return;
		}

		const selectedCount = localSelectedFields?.size || 0;

		if (selectedCount === 0) {
			// None checked -> check all
			activeFeatureLayer.fields.forEach((field) => {
				localSelectedFields.add(field.name);
			});
		} else {
			// Some checked or all checked -> uncheck all
			localSelectedFields.clear();
		}
	}

	function getFieldNamesToShow(): __esri.Field[] {
		if (!activeFeatureLayer?.fields) {
			return [];
		}

		return activeFeatureLayer.fields;
	}
</script>

{#if activeFeatureLayer}
	<div
		class="card-container"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<Card.Root class="command-card">
			<button class="close-button" onclick={closeModal} aria-label="Close">
				<X size={20} />
			</button>
			<Card.Content class="card-content">
				<Command.Root>
					<Command.Input placeholder="Search for fields..." />
					<Command.List>
						<Command.Empty>No results found.</Command.Empty>
						<Command.Group heading="Fields">
							<div class="master-checkbox-container">
								<Checkbox
									checked={masterCheckboxState.checked}
									indeterminate={masterCheckboxState.indeterminate}
									onCheckedChange={handleMasterCheckboxClick}
								/>
								<span class="master-checkbox-label">Select All Fields</span>
							</div>
							<Command.Separator />
							{#each getFieldNamesToShow() as field}
								<Command.Item class="field-item" onselect={() => toggleFieldSelection(field.name)}>
									<div class="field-content-wrapper">
										<Checkbox
											class="field-checkbox"
											checked={localSelectedFields?.has(field.name) ?? false}
											onCheckedChange={() => toggleFieldSelection(field.name)}
										/>
										<button
											class="field-content"
											onclick={() => toggleFieldSelection(field.name)}
											tabindex="0"
										>
											<div class="field-name-container">
												<span class="field-name">{field.alias || field.name}</span>
												{#if field.description}
													<div class="info-icon-container" title={field.description}>
														{@html InformationIcon}
													</div>
												{/if}
											</div>
										</button>
									</div>
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			</Card.Content>
		</Card.Root>
	</div>
{/if}

<style>
	.card-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 50;
	}

	:global(.command-card) {
		width: 700px;
		height: 500px;
		max-width: 90vw;
		max-height: 90vh;
		position: relative;
	}

	:global(.card-content) {
		height: 100%;
		padding: 1rem;
		display: flex;
		flex-direction: column;
	}

	/* Force Command component to use full height */
	:global(.command-card .command-root),
	:global(.command-card [cmdk-root]) {
		height: 100% !important;
		display: flex !important;
		flex-direction: column !important;
	}

	/* Make Command.List take remaining space and scroll */
	:global(.command-card [cmdk-list]),
	:global(.command-card .command-list) {
		flex: 1 !important;
		overflow-y: auto !important;
		max-height: none !important;
		height: auto !important;
	}

	/* Ensure groups don't have height restrictions */
	:global(.command-card [cmdk-group]),
	:global(.command-card .command-group) {
		max-height: none !important;
		overflow: visible !important;
	}

	/* Fix Command.Input container */
	:global(.command-card [cmdk-input-wrapper]),
	:global(.command-card .command-input-wrapper) {
		flex-shrink: 0 !important;
	}

	.close-button {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		color: hsl(var(--foreground));
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background: hsl(var(--accent));
		color: hsl(var(--accent-foreground));
	}

	.close-button:focus {
		outline: none;
		box-shadow: 0 0 0 2px hsl(var(--ring));
	}

	:global(.field-item) {
		padding: 0 !important;
	}

	.field-content-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		width: 100%;
	}

	.field-content {
		display: flex;
		align-items: center;
		flex: 1;
		cursor: pointer;
		border: none;
		background: none;
		text-align: left;
		padding: 0;
		transition: background-color 0.2s ease;
	}

	:global(.field-item):hover .field-content-wrapper {
		background-color: hsl(var(--accent) / 0.5);
		border-radius: 0.25rem;
	}

	/* Override Command.Item SVG color inheritance for checkboxes */
	:global(.field-item .field-checkbox [data-slot='checkbox-indicator'] svg) {
		color: currentColor !important;
	}

	/* Ensure checkbox maintains its proper styling */
	:global(.field-checkbox[data-slot='checkbox']) {
		flex-shrink: 0;
	}

	.field-name-container {
		flex: 1;
		display: flex;
		align-items: center;
	}

	.field-name {
		font-size: 0.875rem;
	}

	.master-checkbox-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border-bottom: 1px solid hsl(var(--border));
		margin-bottom: 0.5rem;
	}

	.master-checkbox-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.info-icon-container {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		margin-left: 0.25rem;
		cursor: help;
		opacity: 0.6;
		transition: opacity 0.2s ease;
		flex-shrink: 0;
	}

	.info-icon-container:hover {
		opacity: 1;
	}

	.info-icon-container :global(svg) {
		width: 14px;
		height: 14px;
		color: hsl(var(--muted-foreground));
	}
</style>
