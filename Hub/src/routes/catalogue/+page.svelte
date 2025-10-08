<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
</script>

<div class="search-container">
	<InputGroup.Root class="search-bar">
		<InputGroup.Input placeholder="Search..." />
		<InputGroup.Addon>
			<SearchIcon />
		</InputGroup.Addon>
		<InputGroup.Addon align="inline-end">
			<InputGroup.Button>Search</InputGroup.Button>
		</InputGroup.Addon>
	</InputGroup.Root>
</div>

<style>
	.search-container {
		display: flex;
		justify-content: center;
		margin-top: 5vh;
		padding: 0 2rem;
	}

	:global(.search-bar) {
		max-width: 1000px; /* Shorter width */
		width: 100%;
	}
</style>
