<script lang="ts">
	import ItemDetailContent from '$lib/components/item-detail/item-detail-content.svelte';
	import { Button } from '$lib/components/shadcn/button';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import ScrollArea from '$lib/components/shadcn/scroll-area/scroll-area.svelte';
	import * as Tooltip from '$lib/components/shadcn/tooltip/index.js';
	import type { CatalogueItemDetail } from '$lib/utils/catalogue-ui';
	import { buildItemHref } from '$lib/utils/catalogue-ui';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';

	type Props = {
		item: CatalogueItemDetail;
		open?: boolean;
	};

	let { item, open = $bindable(false) }: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="item-dialog h-[92vh] min-h-0 w-[80vw] max-w-[80vw] sm:max-w-[80vw] grid-rows-[auto_1fr] overflow-hidden p-0"
	>
		<div class="item-dialog__header-wrap">
			<!-- <div class="item-dialog__actions">
				<Tooltip.Provider disableHoverableContent>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								class="opacity-70"
								variant="outline"
								size="icon"
								href={buildItemHref(item.fileIdentifier)}
								aria-label="Open item page"
							>
								<ArrowUpRightIcon class="h-4 w-4" />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content side="bottom">Open item page</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</div> -->

			<Dialog.Header class="border-b px-12 py-8 pb-6 pr-24">
				<Dialog.Title class="text-left text-2xl leading-tight">{item.title}</Dialog.Title>
			</Dialog.Header>
		</div>

		<div class="item-dialog__body">
			<ScrollArea class="h-full min-h-0 w-full">
				<div class="item-dialog__content">
					<ItemDetailContent {item} showSummaryText={false} summaryLayout="split" />
				</div>
			</ScrollArea>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(.item-dialog) {
		display: grid;
	}

	.item-dialog__header-wrap {
		position: relative;
	}

	.item-dialog__body {
		min-height: 0;
		overflow: hidden;
		background: hsl(var(--muted) / 0.18);
	}

	.item-dialog__actions {
		position: absolute;
		top: 1.5rem;
		right: 3.75rem;
		z-index: 10;
		display: flex;
		gap: 0.5rem;
	}

	.item-dialog__content {
		padding: 1.5rem;
	}

	@media (max-width: 768px) {
		.item-dialog__content {
			padding: 1rem;
		}
	}
</style>
