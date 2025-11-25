<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { ConfigManager } from '$lib/stores/config-manager.svelte';
	import type { PortalItemConfig } from '$lib/types/config';
	import TreeviewConfigEditor from './treeview-config-editor.svelte';
	import { Layers, Database } from '@lucide/svelte';

	let { manager }: { manager: ConfigManager<PortalItemConfig> } = $props();

	let showAreaTreeviewEditor = $state(false);
	let showDataTreeviewEditor = $state(false);

	function initAreaTreeview() {
		if (manager.value && !manager.value.areaTreeview) {
			manager.value.areaTreeview = { items: [] };
		}
		showAreaTreeviewEditor = true;
	}

	function initDataTreeview() {
		if (manager.value && !manager.value.dataTreeview) {
			manager.value.dataTreeview = { items: [] };
		}
		showDataTreeviewEditor = true;
	}
</script>

<div class="space-y-4">
	{#if manager.value}
		<div class="grid w-full items-center gap-1.5">
			<Label>Title</Label>
			<Input bind:value={manager.value.title} placeholder="Map Title" />
		</div>
		<div class="grid w-full items-center gap-1.5">
			<Label>Portal URL</Label>
			<Input bind:value={manager.value.portalUrl} placeholder="https://www.arcgis.com" />
		</div>
		<div class="grid w-full items-center gap-1.5">
			<Label>Item ID</Label>
			<Input bind:value={manager.value.portalItemId} placeholder="Portal Item ID" />
		</div>

		<div class="flex gap-2 pt-2">
			<Button variant="outline" class="flex-1" onclick={initAreaTreeview}>
				<Layers class="mr-2 h-4 w-4" />
				Edit Area Treeview
			</Button>
			<Button variant="outline" class="flex-1" onclick={initDataTreeview}>
				<Database class="mr-2 h-4 w-4" />
				Edit Data Treeview
			</Button>
		</div>

		<Dialog.Root bind:open={showAreaTreeviewEditor}>
			<Dialog.Content class="max-h-[90vh] max-w-4xl overflow-y-auto">
				<Dialog.Header>
					<Dialog.Title>Area Treeview Configuration</Dialog.Title>
					<Dialog.Description>Configure the layer structure for area selection.</Dialog.Description>
				</Dialog.Header>
				{#if manager.value.areaTreeview}
					<TreeviewConfigEditor config={manager.value.areaTreeview} />
				{/if}
			</Dialog.Content>
		</Dialog.Root>

		<Dialog.Root bind:open={showDataTreeviewEditor}>
			<Dialog.Content class="max-h-[90vh] max-w-4xl overflow-y-auto">
				<Dialog.Header>
					<Dialog.Title>Data Treeview Configuration</Dialog.Title>
					<Dialog.Description>Configure the layer structure for data selection.</Dialog.Description>
				</Dialog.Header>
				{#if manager.value.dataTreeview}
					<TreeviewConfigEditor config={manager.value.dataTreeview} />
				{/if}
			</Dialog.Content>
		</Dialog.Root>
	{:else}
		<div class="p-4 text-center text-muted-foreground">
			No configuration loaded. Load from URL or File above.
		</div>
	{/if}
</div>
