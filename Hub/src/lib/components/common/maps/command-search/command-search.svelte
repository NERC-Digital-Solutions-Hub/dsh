<script lang="ts">
	import * as Command from '$lib/components/ui/command/index.js';
	import CommandInputAlt from '$lib/components/ui/command/command-input-alt.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import UseFetchWebMaps from '$lib/hooks/use-fetch-web-maps.svelte';
	import type { MapCommand } from '$lib/types/maps';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import { CommandIcon } from 'lucide-svelte';

	type PanelConfig = {
		props?: Record<string, unknown>;
	};

	type Props = {
		commands?: MapCommand[];
		placeholder?: string;
		emptyMessage?: string;
	};

	const {
		commands: providedCommands = [],
		placeholder = 'Search commands...',
		emptyMessage = 'No commands found.'
	}: Props = $props();

	let activeCommand = $state<MapCommand | null>(null);
	let pendingCommandId = $state<string | null>(null);
	let commandError = $state<Error | null>(null);

	let inputValue = $state('');
	let isOpen = $state(false);

	const registry = $derived.by(() => {
		const deduped = new Map<string, MapCommand>();
		for (const command of providedCommands) {
			deduped.set(command.id, command);
		}
		return Array.from(deduped.values());
	});

	const groupedCommands = $derived.by(() => {
		const groups = new Map<string | null, MapCommand[]>();
		for (const command of registry) {
			const key = command.group ?? null;
			const bucket = groups.get(key);
			if (bucket) {
				bucket.push(command);
			} else {
				groups.set(key, [command]);
			}
		}

		for (const [, commands] of groups) {
			commands.sort((a, b) => a.name.localeCompare(b.name));
		}

		return groups;
	});

	function getCommandValue(command: MapCommand) {
		return `${command.name} ${command.description ?? ''}`.trim();
	}

	async function runCommand(command: MapCommand) {
		pendingCommandId = command.id;
		commandError = null;
		activeCommand = command;

		try {
			await command.execute();
		} catch (error) {
			commandError = error instanceof Error ? error : new Error('Failed to execute the command.');
		} finally {
			pendingCommandId = null;
			inputValue = '';
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		// Toggle command palette with Ctrl+P or Cmd+P
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'p') {
			event.preventDefault();
			isOpen = !isOpen;
			return;
		}

		// Close on Escape
		if (event.key === 'Escape' && isOpen) {
			event.preventDefault();
			isOpen = false;
			return;
		}

		// Check for command shortcuts
		for (const command of registry) {
			if (command.shortcut) {
				const shortcutString = command.shortcut.join(' ').toLowerCase();
				const pressedKeys = [];
				if (event.metaKey) pressedKeys.push('⌘');
				if (event.ctrlKey) pressedKeys.push('Ctrl');
				if (event.altKey) pressedKeys.push('Alt');
				if (event.shiftKey) pressedKeys.push('Shift');
				pressedKeys.push(event.key.length === 1 ? event.key.toUpperCase() : event.key);
				const pressedString = pressedKeys.join(' ').toLowerCase();

				if (pressedString === shortcutString.toLowerCase()) {
					event.preventDefault();
					runCommand(command);
					if (!isOpen) {
						isOpen = true;
					} else {
						isOpen = false;
					}
					break;
				}
			}
		}
	}

	function handleInputFocus() {
		isOpen = true;
	}

	function handleInputBlur() {
		// Delay closing to allow clicks on items
		setTimeout(() => {
			isOpen = false;
		}, 200);
	}

	$effect(() => {
		if (isOpen) {
			return;
		}

		activeCommand = null;
		inputValue = '';
	});
</script>

<svelte:document onkeydown={handleKeydown} />

<div class="space-y-4">
	<Command.Root
		class="bg-transparent [&_[data-slot=command-input-wrapper]]:rounded-md [&_[data-slot=command-input-wrapper]]:bg-background"
	>
		<CommandInputAlt
			{placeholder}
			bind:value={inputValue}
			onfocus={handleInputFocus}
			onblur={handleInputBlur}
		/>
		{#if isOpen}
			<Card.Root class="mt-3 pt-2 pb-0.5">
				<ScrollArea>
					{#if !activeCommand}
						<Card.Content class="pt-0 pr-2 pb-1 pl-2">
							<Command.List class="max-h-60 bg-transparent">
								<Command.Empty>{emptyMessage}</Command.Empty>

								{#each Array.from(groupedCommands.entries()) as [groupName, commands]}
									<Command.Group heading={groupName ?? undefined}>
										{#each commands as command (command.id)}
											<Command.Item
												value={getCommandValue(command)}
												onclick={() => runCommand(command)}
											>
												<div class="flex flex-col gap-0.5">
													<span class="text-sm leading-tight font-medium">{command.name}</span>
													{#if command.description}
														<span class="text-xs text-muted-foreground">{command.description}</span>
													{/if}
												</div>
												{#if pendingCommandId === command.id}
													<Spinner class="ml-auto size-4 text-muted-foreground" />
												{:else if command.shortcut?.length}
													<Command.Shortcut>
														{command.shortcut?.join(' + ')}
													</Command.Shortcut>
												{/if}
											</Command.Item>
										{/each}
									</Command.Group>
								{/each}
							</Command.List>
						</Card.Content>
					{:else if activeCommand.props}
						<activeCommand.component {...activeCommand.props()} />
					{:else}
						<activeCommand.component />
					{/if}
				</ScrollArea>
			</Card.Root>
		{/if}
	</Command.Root>
</div>
