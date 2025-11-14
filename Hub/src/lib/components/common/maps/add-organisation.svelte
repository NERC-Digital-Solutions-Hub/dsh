<script lang="ts">
	import * as Command from '$lib/components/ui/command/index.js';
	import { onDestroy, onMount } from 'svelte';
	import type { MapCommandRuntime, MapsOrganisationConfig } from '$lib/types/maps';
	import { browser } from '$app/environment';
	import type { CommandSearchContext } from '$lib/services/command-search/command-search-context';
	import { MapsConfig } from '$lib/models/maps-config';

	type Props = {
		commandSearchContext: CommandSearchContext;
		inputPlaceholder?: string;
		runtime?: MapCommandRuntime | null;
	};

	const { commandSearchContext, inputPlaceholder, runtime = null }: Props = $props();

	let organisations: MapsOrganisationConfig[] = $state([]);
	let query = $state('');

	onMount(async () => {
		if (!browser) {
			return;
		}

		const contextOrganisations: MapsOrganisationConfig[] | null =
			commandSearchContext.get(MapsConfig)?.organisations;
		if (!contextOrganisations) {
			console.warn('No organisation configuration found in MapsConfig');
			return;
		}

		organisations = contextOrganisations;
	});

	// Track the runtime attachment so we only register handlers when it changes.
	let registeredRuntime: MapCommandRuntime | null = null;
	let detachRuntime: (() => void) | null = null;
	let lastPlaceholder = inputPlaceholder ?? 'Search...';

	$effect(() => {
		const currentRuntime = runtime;
		const placeholderText = inputPlaceholder ?? 'Search...';

		if (!currentRuntime) {
			detachRuntime?.();
			detachRuntime = null;
			registeredRuntime = null;
			query = '';
			lastPlaceholder = placeholderText;
			return;
		}

		if (currentRuntime === registeredRuntime) {
			if (placeholderText !== lastPlaceholder) {
				currentRuntime.setPlaceholder(placeholderText);
				lastPlaceholder = placeholderText;
			}
			return;
		}

		detachRuntime?.();
		detachRuntime = null;
		registeredRuntime = null;
		lastPlaceholder = placeholderText;

		const handleInput = (value: string) => {
			query = value;
		};

		currentRuntime.setPlaceholder(placeholderText);
		currentRuntime.setInputHandler(handleInput);
		const initialValue = currentRuntime.getInputValue();
		query = initialValue;
		if (initialValue) {
			currentRuntime.setInputValue('');
			query = '';
		}

		detachRuntime = () => {
			currentRuntime.setInputHandler(null);
			currentRuntime.resetPlaceholder();
			currentRuntime.setInputValue('');
			if (registeredRuntime === currentRuntime) {
				registeredRuntime = null;
			}
			query = '';
		};

		registeredRuntime = currentRuntime;
	});

	onDestroy(() => {
		detachRuntime?.();
		detachRuntime = null;
		registeredRuntime = null;
	});
</script>

<div class="item-container">
	<Command.List>
		{#if organisations.length === 0}
			<Command.Empty>No organisations match your search.</Command.Empty>
		{:else}
			{#each organisations as organisation (organisation.name)}
				<Command.Item onclick={() => {}}>
					<div class="flex w-full min-w-0 flex-col gap-0.5">
						<span class="title-text font-medium text-foreground">
							{organisation.name ?? 'Untitled organisation'}
						</span>
					</div>
				</Command.Item>
			{/each}
		{/if}
	</Command.List>
</div>

<style>
	.item-container {
		max-width: 40vw;
		max-height: 500px;
		margin-left: 0.75rem;
		margin-right: 0.75rem;
	}

	.error-message {
		padding: 0.75rem;
		margin-bottom: 0.5rem;
		background-color: #fee;
		border-radius: 0.375rem;
		border: 1px solid #fcc;
	}

	.title-text {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
	}

	.description-text {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
		line-height: 1.2;
	}
</style>
