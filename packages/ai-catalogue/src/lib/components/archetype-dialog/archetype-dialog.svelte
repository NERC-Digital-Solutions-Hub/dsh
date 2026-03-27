<script lang="ts">
	import ArchetypeCard from '$lib/components/archetype-dialog/archetype-card.svelte';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import type { ArchetypeDefinition } from '$lib/types/api.types';
	import {
		ChartArea,
		Trees,
		Monitor,
		PersonStanding,
		ShieldCheck,
		BookSearch,
		MapPinned
	} from '@lucide/svelte';

	const archetypeIcons = {
		1: ChartArea,
		2: Trees,
		3: Monitor,
		4: PersonStanding,
		5: ShieldCheck,
		6: BookSearch,
		7: MapPinned
	};

	type Props = {
		archetypes: ArchetypeDefinition[];
		open?: boolean;
		onSelectArchetype?: (archetype: ArchetypeDefinition) => void;
	};

	let { archetypes, open = $bindable(false), onSelectArchetype }: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="item-dialog grid h-[92vh] min-h-0 w-[65vw] max-w-[65vw] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[80vw]"
	>
		<Dialog.Header class="m-0 border-b px-6 py-5 text-center sm:text-center">
			<Dialog.Title class="text-center text-2xl leading-tight">Select a role</Dialog.Title>
		</Dialog.Header>

		<div class="min-h-0 overflow-auto px-6 py-6">
			<div class="mx-auto flex min-h-full min-w-max w-fit flex-col justify-center gap-6">
				<div class="flex flex-nowrap justify-center gap-6">
					{#each archetypes.slice(0, 4) as archetype}
						{@const Icon = archetypeIcons[archetype.id as keyof typeof archetypeIcons] ?? ChartArea}
						<ArchetypeCard
							{archetype}
							icon={Icon}
							onSelect={(archetype) => {
								onSelectArchetype?.(archetype);
								open = false;
							}}
						/>
					{/each}
				</div>
				<div class="flex flex-nowrap justify-center gap-6">
					{#each archetypes.slice(4, 7) as archetype}
						{@const Icon = archetypeIcons[archetype.id as keyof typeof archetypeIcons] ?? ChartArea}
						<ArchetypeCard
							{archetype}
							icon={Icon}
							onSelect={(archetype) => {
								onSelectArchetype?.(archetype);
								open = false;
							}}
						/>
					{/each}
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
