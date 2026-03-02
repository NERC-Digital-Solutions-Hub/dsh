<script lang="ts">
	import { Button, buttonVariants } from '$lib/Components/shadcn/button/index.js';
	import * as Dialog from '$lib/Components/shadcn/dialog/index.js';
	import * as RadioGroup from '$lib/Components/shadcn/radio-group/index.js';
	import type { PortalItemConfig } from '$lib/Types/Configuration.types';
	import { Settings } from '@lucide/svelte';
	import { Label } from '$lib/Components/shadcn/label/index.js';
	import { cn } from '$lib/utils';

	type Props = {
		maps: PortalItemConfig[];
		currentMapIndex: number;
		onSelectMap: (mapIndex: number) => void;
		buttonClass?: string;
	};

	const { maps, currentMapIndex, onSelectMap, buttonClass }: Props = $props();

	let currentOptionIndex: number = $state(0);

	function onOpen() {
		currentOptionIndex = currentMapIndex;
	}

	function onSubmit() {
		console.log('Submitting map selection, currentMapIndex:', currentOptionIndex);
		if (currentOptionIndex === currentMapIndex) {
			return; // No map selected
		}

		onSelectMap(currentOptionIndex);
	}
</script>

<Dialog.Root>
	<Dialog.Trigger
		onclick={onOpen}
		title="Settings"
		class={cn(buttonVariants({ variant: 'outline' }), buttonClass)}
	>
		<Settings />
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Select Map</Dialog.Title>
			<Dialog.Description>Choose a map from the list below.</Dialog.Description>
		</Dialog.Header>
		<RadioGroup.Root
			value={currentOptionIndex.toString()}
			onValueChange={(value: any) => (currentOptionIndex = parseInt(value))}
		>
			{#each maps as map, index}
				<div class="flex items-center space-x-2">
					<RadioGroup.Item value={index.toString()} id={`map-${index}`} />
					<Label for={`map-${index}`}>{map.title}</Label>
				</div>
			{/each}
		</RadioGroup.Root>
		<Dialog.Footer>
			<Button type="submit" onclick={onSubmit}>Save changes</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
