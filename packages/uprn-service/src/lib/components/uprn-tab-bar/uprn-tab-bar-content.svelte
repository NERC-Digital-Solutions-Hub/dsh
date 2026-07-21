<script lang="ts">
	import * as Card from '$lib/components/shadcn/card/index.js';
	import * as Tabs from '$lib/components/shadcn/tabs/index.js';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	/**
	 * Props for the UPRNTabBarContent component.
	 */
	type Props = {
		/** The tab value this content panel is associated with. */
		value: string;
		/** Optional classes for the Tabs.Content element. */
		class?: string;
		/** Optional classes for the Card.Content element. */
		contentClass?: string;
		/** Optional children snippet for the tab content. */
		children?: Snippet;
	};

	const { value, class: className, contentClass, children }: Props = $props();
</script>

<Tabs.Content {value} class={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}>
	<Card.Content
		class={cn(
			'card-content flex min-h-0 flex-1 flex-col overflow-hidden p-0 text-sm leading-5 transition-all duration-150',
			contentClass
		)}
	>
		<div class="flex min-h-0 min-w-0 flex-1 flex-col space-y-2">
			{@render children?.()}
		</div>
	</Card.Content>
</Tabs.Content>
