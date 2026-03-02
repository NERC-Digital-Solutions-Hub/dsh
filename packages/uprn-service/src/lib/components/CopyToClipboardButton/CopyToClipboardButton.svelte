<script lang="ts">
	import Button from '$lib/Components/shadcn/button/button.svelte';
	import ClipboardIcon from '@lucide/svelte/icons/clipboard';
	import ClipboardCheckIcon from '@lucide/svelte/icons/clipboard-check';
	import { toast } from 'svelte-sonner';
	import { cn } from '$lib/utils.js';

	type Props = {
		value: string;
		title?: string;
		successMessage?: string;
		errorMessage?: string;
		resetAfterMs?: number;
		iconSize?: number;
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
		size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
		class?: string;
	};

	let {
		value,
		title = 'Copy to clipboard',
		successMessage = 'Copied to clipboard',
		errorMessage = 'Failed to copy to clipboard',
		resetAfterMs = 2000,
		iconSize = 14,
		variant = 'ghost',
		size = 'sm',
		class: className
	}: Props = $props();

	let copied = $state(false);
	let resetTimeout: ReturnType<typeof setTimeout> | null = null;

	async function onCopy() {
		if (!value) {
			return;
		}

		try {
			await navigator.clipboard.writeText(value);
			copied = true;
			toast.success(successMessage);

			if (resetTimeout) {
				clearTimeout(resetTimeout);
			}

			resetTimeout = setTimeout(() => {
				copied = false;
				resetTimeout = null;
			}, resetAfterMs);
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
			toast.error(errorMessage);
		}
	}

	$effect(() => {
		return () => {
			if (resetTimeout) {
				clearTimeout(resetTimeout);
			}
		};
	});
</script>

<Button {variant} {size} class={cn(className)} disabled={!value} onclick={onCopy} {title}>
	{#if copied}
		<ClipboardCheckIcon size={iconSize} />
	{:else}
		<ClipboardIcon size={iconSize} />
	{/if}
</Button>
