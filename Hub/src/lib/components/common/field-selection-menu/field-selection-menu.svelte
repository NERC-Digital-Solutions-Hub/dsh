<script lang="ts">
	import { dataSelectionStore } from '$lib/stores/data-selection-store.svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { X } from '@lucide/svelte';

	function closeModal() {
		dataSelectionStore.FieldViewSelection = null;
	}

	function handleBackdropClick(event: MouseEvent) {
		// Close modal only if clicking the backdrop, not the card content
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}
</script>

{#if dataSelectionStore.FieldViewSelection}
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
						<Command.Group heading="Commands">
							<Command.Item>Select All</Command.Item>
							<Command.Item>Deselect All</Command.Item>
						</Command.Group>
						<Command.Separator />
						<Command.Group heading="Fields">
							<Command.Item>Field 1</Command.Item>
							<Command.Item>Field 2</Command.Item>
							<Command.Item>Field 3</Command.Item>
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
		width: 400px;
		height: 400px;
		max-width: 90vw;
		max-height: 90vh;
		position: relative;
	}

	:global(.card-content) {
		height: 100%;
		padding: 1rem;
	}

	:global(.command-card .command-root) {
		height: 100%;
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
</style>
