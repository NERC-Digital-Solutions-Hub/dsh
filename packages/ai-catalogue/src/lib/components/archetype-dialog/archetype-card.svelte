<script lang="ts">
	import * as Button from '$lib/components/shadcn/button/index.js';
	import type { ArchetypeDefinition } from '$lib/types/api.types';
	import type { Component } from 'svelte';

	type Props = {
		archetype: ArchetypeDefinition;
		icon: Component;
		onSelect: (archetype: ArchetypeDefinition) => void;
	};

let { archetype, icon, onSelect }: Props = $props();
</script>

<Button.Button
	class="archetype-card h-auto w-40 aspect-square flex-col items-center justify-center gap-4 whitespace-normal px-4 py-6 text-center sm:w-44 md:w-48"
	onclick={() => onSelect(archetype)}
>
	{@const Icon = icon}
	<Icon class="size-14 shrink-0 md:size-16" strokeWidth={1.75} />
	<h3 class="max-w-full text-base font-semibold leading-tight break-words md:text-lg">
		{archetype.name}
	</h3>
</Button.Button>
