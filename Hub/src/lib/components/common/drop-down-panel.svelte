<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
</script>

<Card.Root>
	<Card.Content>
		<div class="drop-down-panel">
			<Accordion.Root type="single">
				<Accordion.Item value="item-1">
					<Accordion.Trigger>Treeview</Accordion.Trigger>
					<Accordion.Content
						class="accordion-content flex flex-col gap-4 overflow-hidden text-balance
                   data-[state=closed]:m-0 data-[state=closed]:h-0 data-[state=closed]:animate-accordion-up
                   data-[state=closed]:p-0 data-[state=open]:animate-accordion-down"
					>
						<p>Item1</p>
						<p>Item2</p>
						<p>Item3</p>
						<p>Item4</p>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</div>
	</Card.Content>
</Card.Root>

<style>
	.drop-down-panel {
		width: 100%;
		min-width: 200px;
		justify-content: center;
	}
</style>
