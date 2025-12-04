<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Settings, Plus, Trash2 } from '@lucide/svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { cn } from '$lib/utils';
	import { uprnConfigStore } from '$lib/stores/apps/uprn/uprn-store.svelte';
	import ConfigEditor from './config-editor.svelte';
	import MapConfigEditor from './map-config-editor.svelte';
	import { ConfigManager } from '$lib/stores/config-manager.svelte';
	import type { PortalItemConfig } from '$lib/types/config';

	type Props = {
		onSelectMap: (mapIndex: number) => void;
		buttonClass?: string;
	};

	const { onSelectMap, buttonClass }: Props = $props();

	let currentMapIndex = $state(-1);
	let configStore = $derived(uprnConfigStore.instance);

	function onOpen() {
		// Reset or initialize state if needed
	}

	function onSelectMapSubmit() {
		if (currentMapIndex === -1) {
			return; // No map selected
		}
		onSelectMap(currentMapIndex);
	}

	function addMap() {
		if (configStore) {
			configStore.mapsConfig.push(new ConfigManager<PortalItemConfig>());
		}
	}

	function removeMap(index: number) {
		if (configStore) {
			configStore.mapsConfig.splice(index, 1);
			if (currentMapIndex === index) {
				currentMapIndex = -1;
			} else if (currentMapIndex > index) {
				currentMapIndex--;
			}
		}
	}
</script>

<Dialog.Root>
	<Dialog.Trigger onclick={onOpen} class={cn(buttonVariants({ variant: 'outline' }), buttonClass)}>
		<Settings />
	</Dialog.Trigger>
	<Dialog.Content class="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Configuration</Dialog.Title>
			<Dialog.Description>Manage application settings and configurations.</Dialog.Description>
		</Dialog.Header>

		{#if configStore}
			<Tabs.Root value="maps" class="w-full">
				<Tabs.List class="grid w-full grid-cols-3">
					<Tabs.Trigger value="maps">Maps</Tabs.Trigger>
					<Tabs.Trigger value="download">Download API</Tabs.Trigger>
					<Tabs.Trigger value="chatbot">Chatbot API</Tabs.Trigger>
				</Tabs.List>

				<Tabs.Content value="maps" class="space-y-4">
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-medium">Available Maps</h3>
							<Button variant="outline" size="sm" onclick={addMap}>
								<Plus class="mr-2 h-4 w-4" /> Add Map
							</Button>
						</div>

						<RadioGroup.Root
							value={currentMapIndex.toString()}
							onValueChange={(value) => (currentMapIndex = parseInt(value))}
						>
							{#each configStore.mapsConfig as mapManager, index}
								<div class="space-y-2 rounded-md border p-4">
									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-2">
											<RadioGroup.Item value={index.toString()} id={`map-${index}`} />
											<Label for={`map-${index}`}>
												{mapManager.value?.title || `Map ${index + 1} (Not Loaded)`}
											</Label>
										</div>
										<Button
											variant="ghost"
											size="icon"
											onclick={() => removeMap(index)}
											class="text-red-500 hover:text-red-700"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>

									<ConfigEditor
										manager={mapManager}
										title={`Map ${index + 1} Configuration`}
										fields={[]}
									/>
									<MapConfigEditor manager={mapManager} />
								</div>
							{/each}
						</RadioGroup.Root>

						<div class="flex justify-end">
							<Button onclick={onSelectMapSubmit} disabled={currentMapIndex === -1}>
								Select Map
							</Button>
						</div>
					</div>
				</Tabs.Content>

				<Tabs.Content value="download" class="space-y-4">
					<ConfigEditor
						manager={configStore.uprnDownloadApiConfig}
						title="Download API Configuration"
						fields={[
							{ key: 'baseUrl', label: 'Base URL' },
							{ key: 'healthRoute', label: 'Health Route' },
							{ key: 'requestJobRoute', label: 'Request Job Route' },
							{ key: 'requestJobStatusesRoute', label: 'Job Statuses Route' },
							{ key: 'getAreaSelectionLimitsRoute', label: 'Area Limits Route' },
							{ key: 'fetchDownloadRoute', label: 'Fetch Download Route' }
						]}
					/>
				</Tabs.Content>

				<Tabs.Content value="chatbot" class="space-y-4">
					<ConfigEditor
						manager={configStore.uprnChatbotApiConfig}
						title="Chatbot API Configuration"
						fields={[
							{ key: 'baseUrl', label: 'Base URL' },
							{ key: 'healthRoute', label: 'Health Route' },
							{ key: 'chatRoute', label: 'Chat Route' },
							{ key: 'chatStreamRoute', label: 'Chat Stream Route' }
						]}
					/>
				</Tabs.Content>
			</Tabs.Root>
		{/if}
	</Dialog.Content>
</Dialog.Root>
