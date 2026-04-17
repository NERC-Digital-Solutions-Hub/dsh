<script lang="ts">
	import { Input } from '$lib/Components/shadcn/input/index.js';
	import { Search, X } from '@lucide/svelte';

	type Props = {
		/** Current search text (bindable). */
		searchText: string;
		/** Placeholder shown inside the input when expanded. */
		placeholder?: string;
		/**
		 * When true (default), the bar starts as a compact input and expands on focus,
		 * collapsing back when empty and blurred. When false, the bar is always expanded.
		 */
		collapsible?: boolean;
	};

	let {
		searchText = $bindable(''),
		placeholder = 'Search...',
		collapsible = true
	}: Props = $props();

	let expanded = $state(!collapsible);
	let collapsing = $state(false);
	let inputRef: HTMLInputElement | null = $state(null);

	function handleFocus() {
		collapsing = false;
		expanded = true;
	}

	function handleBlur() {
		if (collapsible && !searchText) {
			collapsing = true;
		}
	}

	function handleAnimationEnd() {
		if (collapsing) {
			expanded = false;
			collapsing = false;
		}
	}

	function clearSearch() {
		searchText = '';
		inputRef?.blur();
	}
</script>

<div
	class="search-bar relative h-8 pr-2"
	class:collapsible
	class:expanded
	class:collapsing
	onanimationend={handleAnimationEnd}
>
	<Search
		class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
	/>
	<Input
		bind:ref={inputRef}
		type="text"
		placeholder={expanded && !collapsing ? placeholder : 'Search'}
		class="h-full w-full pl-8 {expanded ? 'pr-8' : 'pr-3'} text-sm"
		bind:value={searchText}
		onfocus={handleFocus}
		onblur={handleBlur}
	/>
	{#if expanded}
		<button
			type="button"
			class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
			onmousedown={(e) => e.preventDefault()}
			onclick={clearSearch}
			aria-label="Clear search"
		>
			<X class="size-4" />
		</button>
	{/if}
</div>

<style>
	.search-bar {
		flex: 1;
		min-width: 0;
	}

	.search-bar.collapsible:not(.expanded) {
		flex: 0 0 auto;
		width: 7rem;
	}

	.search-bar.collapsible.expanded:not(.collapsing) {
		animation: expand 200ms ease-out;
	}

	.search-bar.collapsible.collapsing {
		animation: collapse 200ms ease-out forwards;
	}

	@keyframes expand {
		from {
			clip-path: inset(0 calc(100% - 7rem) 0 0 round 0.375rem);
		}
		to {
			clip-path: inset(0 0 0 0 round 0.375rem);
		}
	}

	@keyframes collapse {
		from {
			clip-path: inset(0 0 0 0 round 0.375rem);
		}
		to {
			clip-path: inset(0 calc(100% - 7rem) 0 0 round 0.375rem);
		}
	}
</style>
