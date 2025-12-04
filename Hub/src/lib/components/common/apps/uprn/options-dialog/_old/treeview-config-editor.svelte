<script lang="ts">
	import type { TreeviewConfig, TreeviewNodeConfig } from '$lib/types/treeview';
	import { TreeviewNodeType } from '$lib/types/treeview';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button';
	import * as Accordion from '$lib/components/ui/accordion';
	import { Trash2, Plus } from '@lucide/svelte';

	let { config }: { config: TreeviewConfig } = $props();

	function addItem() {
		if (!config.items) config.items = [];
		config.items.push({
			id: `node-${Date.now()}`,
			type: TreeviewNodeType.GroupLayer
		});
	}

	function removeItem(index: number) {
		config.items?.splice(index, 1);
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h4 class="font-medium">Nodes</h4>
		<Button size="sm" variant="outline" onclick={addItem}>
			<Plus class="mr-2 h-4 w-4" /> Add Node
		</Button>
	</div>

	<Accordion.Root type="multiple" class="w-full">
		{#each config.items || [] as item, index}
			<Accordion.Item value={item.id || `item-${index}`}>
				<Accordion.Trigger class="hover:no-underline">
					<div class="flex w-full items-center justify-between pr-4">
						<span
							>{item.id || 'New Node'}
							<span class="text-xs text-muted-foreground">({item.type})</span></span
						>
					</div>
				</Accordion.Trigger>
				<Accordion.Content>
					<div class="grid gap-4 rounded-md border bg-muted/10 p-4">
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div class="space-y-2">
								<Label>Name</Label>
								<Input bind:value={item.__name} placeholder="Config Name" />
							</div>
							<div class="space-y-2">
								<Label>ID</Label>
								<Input bind:value={item.id} placeholder="Layer ID" />
							</div>
							<div class="space-y-2">
								<Label>Type</Label>
								<select
									bind:value={item.type}
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
								>
									{#each Object.values(TreeviewNodeType) as type}
										<option value={type}>{type}</option>
									{/each}
								</select>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div class="space-y-2">
								<Label>Visibility Group ID</Label>
								<Input bind:value={item.visibilityGroupId} />
							</div>
							<div class="space-y-2">
								<Label>Inheritance Group ID</Label>
								<Input bind:value={item.inheritanceGroupId} />
							</div>
						</div>

						<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
							<div class="flex items-center space-x-2">
								<Checkbox
									id={`download-${index}`}
									checked={item.isDownloadable ?? false}
									onCheckedChange={(v) => (item.isDownloadable = v as boolean)}
								/>
								<Label for={`download-${index}`}>Downloadable</Label>
							</div>
							<div class="flex items-center space-x-2">
								<Checkbox
									id={`visible-${index}`}
									checked={item.isVisibleOnInit ?? false}
									onCheckedChange={(v) => (item.isVisibleOnInit = v as boolean)}
								/>
								<Label for={`visible-${index}`}>Visible Init</Label>
							</div>
							<div class="flex items-center space-x-2">
								<Checkbox
									id={`hidden-${index}`}
									checked={item.isHidden ?? false}
									onCheckedChange={(v) => (item.isHidden = v as boolean)}
								/>
								<Label for={`hidden-${index}`}>Hidden</Label>
							</div>
							<div class="flex items-center space-x-2">
								<Checkbox
									id={`disable-toggle-${index}`}
									checked={item.disableVisibilityToggle ?? false}
									onCheckedChange={(v) => (item.disableVisibilityToggle = v as boolean)}
								/>
								<Label for={`disable-toggle-${index}`}>Lock Visibility</Label>
							</div>
							<div class="flex items-center space-x-2">
								<Checkbox
									id={`open-${index}`}
									checked={item.isOpenOnInit ?? false}
									onCheckedChange={(v) => (item.isOpenOnInit = v as boolean)}
								/>
								<Label for={`open-${index}`}>Open Init</Label>
							</div>
							<div class="flex items-center space-x-2">
								<Checkbox
									id={`show-fields-${index}`}
									checked={item.showFields ?? false}
									onCheckedChange={(v) => (item.showFields = v as boolean)}
								/>
								<Label for={`show-fields-${index}`}>Show Fields</Label>
							</div>
						</div>

						<div class="flex justify-end pt-2">
							<Button variant="destructive" size="sm" onclick={() => removeItem(index)}>
								<Trash2 class="mr-2 h-4 w-4" /> Remove Node
							</Button>
						</div>
					</div>
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
</div>
