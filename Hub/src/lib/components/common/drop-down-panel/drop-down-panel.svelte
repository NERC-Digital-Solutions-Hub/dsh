<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';

	/**
	 * Header content to display in the dropdown panel
	 */
	export let header: string;

	/**
	 * Optional CSS classes to apply to the root card
	 */
	export let className: string = '';

	/**
	 * Optional accordion value for external control (accordion starts closed by default)
	 */
	export let value: string | undefined = undefined;
</script>

<Card.Root class="drop-down-card {className}">
	<Accordion.Root type="single" {value} class="w-full">
		<Accordion.Item value="panel-content" class="border-none">
			<Accordion.Trigger
				class="drop-down-trigger hover:no-underline data-[state=open]:rounded-none data-[state=open]:border-b-2 data-[state=open]:border-border/60"
			>
				<span class="drop-down-header">{header}</span>
			</Accordion.Trigger>
			<Accordion.Content class="drop-down-content overflow-hidden">
				<ScrollArea class="h-[300px] w-full">
					<div class="space-y-2 p-4">
						<slot />
					</div>
				</ScrollArea>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</Card.Root>

<style>
	/* Card styling */
	:global(.drop-down-card) {
		overflow: hidden;
		border: 1px solid hsl(var(--border) / 0.4);
		padding-top: 0;
		padding-bottom: 0;
		box-shadow:
			0 4px 6px -1px rgb(0 0 0 / 0.1),
			0 2px 4px -2px rgb(0 0 0 / 0.1);
		transition-property: box-shadow;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}

	:global(.drop-down-card:hover) {
		box-shadow:
			0 10px 15px -3px rgb(0 0 0 / 0.1),
			0 4px 6px -4px rgb(0 0 0 / 0.1);
	}

	/* Trigger styling */
	:global(.drop-down-trigger) {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		border-top-left-radius: 0.5rem;
		border-top-right-radius: 0.5rem;
		padding-left: 1rem;
		padding-right: 1rem;
		padding-top: 0.75rem;
		padding-bottom: 0.75rem;
		text-align: left;
		font-weight: 500;
	}

	/* Header text styling */
	:global(.drop-down-header) {
		font-size: 0.875rem;
		line-height: 1.25rem;
		color: hsl(var(--foreground));
	}

	/* Content styling */
	:global(.drop-down-content) {
		font-size: 0.875rem;
		line-height: 1.25rem;
		transition-property: all;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}

	:global(.drop-down-content[data-state='closed']) {
		overflow: hidden;
		animation: slideUp 200ms ease-out;
	}

	:global(.drop-down-content[data-state='open']) {
		overflow: hidden;
		animation: slideDown 200ms ease-out;
	}

	/* Legacy styles */
	:global(.drop-down-panel) {
		width: 100%;
		min-width: 200px;
	}

	/* Enhanced focus styles for accessibility */
	:global(.drop-down-panel [data-radix-collection-item]:focus-visible) {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	@keyframes slideDown {
		from {
			height: 0;
			opacity: 0;
		}
		to {
			height: var(--radix-accordion-content-height);
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			height: var(--radix-accordion-content-height);
			opacity: 1;
		}
		to {
			height: 0;
			opacity: 0;
		}
	}
</style>
