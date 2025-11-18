<script lang="ts">
	import * as Button from '$lib/components/ui/button/index.js';
	import { MapIcon } from 'lucide-svelte';
	import { onDestroy, onMount } from 'svelte';
	import { on } from 'svelte/events';

	type Props = {
		options: SidebarButton[];
		onToggleItem?: (id: string, isActive: boolean) => void;
	};
	type SidebarButton = {
		id: string;
		label: string;
	};

	const { options, onToggleItem }: Props = $props();

	let activeButton = $state('');

	const handleButtonClick = async (buttonId: SidebarButton['id']) => {
		if (activeButton === buttonId) {
			activeButton = '';
			onToggleItem?.(buttonId, false);
		} else {
			activeButton = buttonId;
			onToggleItem?.(buttonId, true);
		}
	};
</script>

<div class="map-sidebar" role="navigation" aria-label="Map tools">
	{#each options as option}
		<Button.Root
			class={`sidebar-button ${option.id === activeButton ? 'active' : ''}`}
			variant="ghost"
			size="icon"
			aria-label={option.label}
			aria-pressed={option.id === activeButton}
			title={option.label}
			onclick={() => void handleButtonClick(option.id)}
		>
			<MapIcon aria-hidden="true" class="sidebar-icon" />
		</Button.Root>
	{/each}
</div>

<style>
	.map-sidebar {
		width: 3.5rem;
		min-width: 3.5rem;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: 0.65rem;
		padding: 1.25rem 0.5rem;
		background: linear-gradient(180deg, #2c2c2c 0%, #1b1b1b 100%);
		border-right: 1px solid #3c3c3c;
		box-shadow: 2px 0 8px rgba(0, 0, 0, 0.4);
		z-index: 20;
	}

	:global(.sidebar-button) {
		width: 2.5rem;
		height: 2.5rem;
		color: #c5c5c5;
		background-color: transparent;
		border-radius: 0.6rem;
		transition:
			background-color 0.15s ease,
			color 0.15s ease,
			box-shadow 0.15s ease,
			transform 0.15s ease;
		box-shadow: inset 0 0 0 0 transparent;
	}

	:global(.sidebar-button:hover),
	:global(.sidebar-button:focus-visible) {
		color: #ffffff;
		background-color: #333538;
		transform: translateY(-1px);
	}

	:global(.sidebar-button.active) {
		color: #ffffff;
		background-color: var(--primary);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
	}

	:global(.sidebar-icon) {
		width: 1.5rem;
		height: 1.5rem;
	}

	@media (max-width: 720px) {
		.map-sidebar {
			width: 100%;
			min-width: unset;
			height: auto;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 0.4rem;
			padding: 0.5rem 0.75rem;
			justify-content: center;
			border-right: none;
			box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
			border-bottom: 1px solid #3c3c3c;
			background: linear-gradient(90deg, #2c2c2c 0%, #1f1f1f 100%);
		}
	}
</style>
