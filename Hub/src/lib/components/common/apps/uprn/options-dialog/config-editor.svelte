<script lang="ts" generics="T extends object">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { ConfigManager } from '$lib/stores/config-manager.svelte';

	let {
		manager,
		title,
		fields
	}: {
		manager: ConfigManager<T>;
		title: string;
		fields: { key: keyof T; label: string }[];
	} = $props();

	let url = $state('');
	let fileInput: HTMLInputElement | undefined = $state();
	let localValue = $state<T | undefined>();

	$effect(() => {
		if (manager.value) {
			localValue = { ...manager.value };
		}
	});

	function save() {
		if (localValue) {
			manager.value = localValue;
		}
	}

	async function loadUrl() {
		if (!url) return;
		await manager.loadFromUrl(url);
	}

	async function loadFile() {
		const file = fileInput?.files?.[0];
		if (!file) return;
		await manager.loadFromFile(file);
	}
</script>

<div class="space-y-4 rounded-md border p-4">
	<h3 class="text-lg font-medium">{title}</h3>

	<div class="flex items-end gap-2">
		<div class="grid w-full items-center gap-1.5">
			<Label for="url-{title}">Load from URL</Label>
			<Input type="url" id="url-{title}" bind:value={url} placeholder="https://..." />
		</div>
		<Button onclick={loadUrl} disabled={manager.isLoading} variant="secondary">Load</Button>
	</div>

	<div class="flex items-end gap-2">
		<div class="grid w-full items-center gap-1.5">
			<Label for="file-{title}">Load from File</Label>
			<Input type="file" id="file-{title}" bind:this={fileInput as any} />
		</div>
		<Button onclick={loadFile} disabled={manager.isLoading} variant="secondary">Load</Button>
	</div>

	{#if manager.error}
		<p class="text-sm text-red-500">{manager.error.message}</p>
	{/if}

	{#if localValue}
		<div class="grid gap-2 py-2">
			{#each fields as field}
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="{title}-{String(field.key)}" class="text-right">{field.label}</Label>
					<Input
						id="{title}-{String(field.key)}"
						value={localValue[field.key]}
						oninput={(e) => {
							if (localValue) {
								// @ts-ignore
								localValue[field.key] = e.currentTarget.value;
							}
						}}
						class="col-span-3"
					/>
				</div>
			{/each}
			<div class="flex justify-end">
				<Button onclick={save}>Save Changes</Button>
			</div>
		</div>
	{/if}
</div>
