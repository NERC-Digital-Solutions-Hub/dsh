<script lang="ts">
	import Button from '$lib/Components/shadcn/button/button.svelte';
	import { Input } from '$lib/Components/shadcn/input/index.js';
	import { ArrowLeft, Search, X } from '@lucide/svelte';

	type Props = {
		/** Current search text (bindable). */
		searchText: string;
		/** Placeholder shown inside the input. */
		placeholder?: string;
		/** When true, the bar starts collapsed as a button and expands on click. */
		collapsible?: boolean;
	};

	let {
		searchText = $bindable(''),
		placeholder = 'Search...',
		collapsible = false
	}: Props = $props();

	let expanded = $state(false);
	let showInput = $derived(!collapsible || expanded);
	let inputRef: HTMLInputElement | null = $state(null);

	function open() {
		expanded = true;
		requestAnimationFrame(() => inputRef?.focus());
	}

	function close() {
		searchText = '';
		expanded = false;
	}
</script>

{#if !showInput}
	<Button
		variant="outline"
		size="icon-sm"
		class="shrink-0 text-muted-foreground"
		onclick={open}
		aria-label="Open search"
	>
		<Search class="size-4" />
	</Button>
{:else}
	<div class="expandable-bar relative h-8 min-w-0 flex-1 pr-2">
		{#if collapsible}
			<Button
				variant="ghost"
				size="icon-sm"
				class="absolute left-0.5 top-1/2 z-10 -translate-y-1/2 size-7 text-muted-foreground hover:text-foreground"
				onclick={close}
				aria-label="Close search"
			>
				<ArrowLeft class="size-4" />
			</Button>
		{:else}
			<Search
				class="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
			/>
		{/if}
		<Input
			bind:ref={inputRef}
			type="text"
			{placeholder}
			class="h-full w-full pl-8 pr-8 text-sm"
			bind:value={searchText}
		/>
		{#if searchText}
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2 transition-colors"
				onclick={() => (searchText = '')}
				aria-label="Clear search"
			>
				<X class="size-4" />
			</button>
		{/if}
	</div>
{/if}

<style>
	.expandable-bar {
		animation: expand-from-button 200ms ease-out;
	}

	@keyframes expand-from-button {
		from {
			clip-path: inset(0 calc(100% - 2rem) 0 0 round 0.375rem);
		}
		to {
			clip-path: inset(0 0 0 0 round 0.375rem);
		}
	}
</style>
