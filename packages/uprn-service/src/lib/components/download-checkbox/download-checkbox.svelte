<script lang="ts">
	import DownloadIcon from '@lucide/svelte/icons/arrow-down-to-line';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import { cn, type WithoutChildren } from '$lib/utils.js';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	/** Controlled download-selection checkbox; the parent owns its visual state. */
	type Props = Omit<WithoutChildren<HTMLButtonAttributes>, 'onclick'> & {
		ref?: HTMLButtonElement | null;
		checked?: boolean;
		indeterminate?: boolean;
		onclick?: (event: MouseEvent) => void;
		/** Called with the next checked state requested by the user. */
		onCheckedChange?: (checked: boolean, event: MouseEvent) => void;
	};

	let {
		ref = $bindable(null),
		checked = false,
		indeterminate = false,
		class: className,
		onclick,
		onCheckedChange,
		...restProps
	}: Props = $props();

	const visualState = $derived(indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked');
	const ariaChecked = $derived(indeterminate ? 'mixed' : checked ? 'true' : 'false');

	function handleClick(event: MouseEvent): void {
		onclick?.(event);
		if (event.defaultPrevented) return;

		onCheckedChange?.(indeterminate || !checked, event);
	}
</script>

<button
	bind:this={ref}
	{...restProps}
	type="button"
	role="checkbox"
	aria-checked={ariaChecked}
	data-state={visualState}
	data-slot="checkbox"
	class={cn(
		'peer flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary',
		className
	)}
	onclick={handleClick}
>
	<div data-slot="checkbox-indicator" class="text-current transition-none">
		{#if indeterminate}
			<MinusIcon data-slot="checkbox-icon-indeterminate" class="size-3.5" />
		{:else if checked}
			<DownloadIcon data-slot="checkbox-icon-checked" class="size-3.5" />
		{/if}
	</div>
</button>
