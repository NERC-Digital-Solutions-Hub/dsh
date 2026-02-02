<script lang="ts">
	import { cn } from '$lib/utils';
	import type { TagDefinition } from '$lib/types/config';
	import type { ITagDefinitionProvider } from '$lib/services/ITagDefinitionProvider';
	import { Badge } from '$lib/components/shadcn/badge/index.js';

	type Props = {
		/** Provider for tag definitions. */
		tagDefinitionProvider?: ITagDefinitionProvider;
		/** The IDs of currently selected tags (bindable). */
		selectedTagIds?: Set<string>;
		/** Optional class to control the container layout from the parent. */
		class?: string;
	};

	let {
		tagDefinitionProvider,
		selectedTagIds = $bindable(new Set<string>()),
		class: containerClass
	}: Props = $props();

	/**
	 * All available tag definitions from the provider.
	 */
	const tagDefinitions: TagDefinition[] = $derived(
		tagDefinitionProvider?.getAllTagDefinitions() ?? []
	);

	/**
	 * Toggles the selection state of a tag.
	 * @param tagId The ID of the tag to toggle.
	 */
	function toggleTag(tagId: string): void {
		const newSet = new Set(selectedTagIds);
		if (newSet.has(tagId)) {
			newSet.delete(tagId);
		} else {
			newSet.add(tagId);
		}
		selectedTagIds = newSet;
	}

	/**
	 * Checks if a tag is currently selected.
	 * @param tagId The ID of the tag to check.
	 * @returns True if the tag is selected, false otherwise.
	 */
	function isSelected(tagId: string): boolean {
		return selectedTagIds.has(tagId);
	}
</script>

{#if tagDefinitions.length > 0}
	<div class={cn('flex flex-wrap gap-2 border-b border-border px-3 py-2', containerClass)}>
		{#each tagDefinitions as tag (tag.id)}
			{@const selected = isSelected(tag.id)}
			<button
				type="button"
				onclick={() => toggleTag(tag.id)}
				aria-pressed={selected}
				class={cn(
					'rounded-full',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
				)}
			>
				<Badge
					variant="outline"
					class={cn(
						'cursor-pointer select-none border-2 px-2.5 py-1 transition-colors duration-150',
						selected ? 'text-white' : 'bg-transparent hover:bg-accent/50'
					)}
					style={selected
						? `background-color: ${tag.color}; border-color: ${tag.color};`
						: `border-color: ${tag.color}; color: ${tag.color};`}
				>
					{tag.label}
				</Badge>
			</button>
		{/each}
	</div>
{/if}
