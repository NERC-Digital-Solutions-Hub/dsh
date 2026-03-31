<script lang="ts">
	import { Eye, EyeOff } from '@lucide/svelte';
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';

	let {
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		onCheckedChange,
		disabled = false,
		...restProps
	}: {
		checked?: boolean;
		indeterminate?: boolean;
		class?: string;
		onCheckedChange?: (checked: boolean) => void;
		disabled?: boolean;
	} = $props();

	/**
	 * Returns the appropriate tooltip content based on the current visibility state.
	 * @returns A string representing the tooltip content.
	 */
	function getTooltipContent(): string {
		if (checked && !indeterminate) {
			return 'Visible';
		} else if (indeterminate) {
			return 'Zoom in/out to view layer';
		} else {
			return 'Not visible';
		}
	}

	function handleClick() {
		if (disabled) return;
		checked = !checked;
		onCheckedChange?.(checked);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (disabled) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			e.stopPropagation();
			handleClick();
		}
	}
</script>

<button
	type="button"
	class="visibility-btn"
	class:visible={checked}
	class:indeterminate
	onclick={(e) => {
		e.stopPropagation();
		handleClick();
	}}
	onkeydown={handleKeydown}
	{disabled}
	role="switch"
	aria-label={getTooltipContent()}
	{...restProps}
>
	<Tooltip.Provider disableHoverableContent>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#if checked}
					<Eye class="size-4" />
				{:else if indeterminate}
					<Eye class="size-4" />
				{:else}
					<EyeOff class="size-4" />
				{/if}
			</Tooltip.Trigger>
			<Tooltip.Content side="right">
				<p>{getTooltipContent()}</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
</button>

<style>
	.visibility-btn {
		/* Layout */
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		padding: 0;

		/* Appearance */
		background: transparent;
		border: none;
		border-radius: 0.125rem;
		cursor: pointer;

		/* Transitions */
		transition: background-color 0.1s ease-out;

		/* Focus */
		outline: none;
	}

	/* Default state - gray/muted color */
	.visibility-btn :global(svg) {
		width: 1rem;
		height: 1rem;
		display: block;
		color: #d1d5db;
		transition: color 0.1s ease-out;
	}

	/* Interactive states for non-visible button */
	.visibility-btn:not(.visible):hover {
		background-color: hsl(var(--muted));
	}

	.visibility-btn:not(.visible):hover :global(svg) {
		color: #9ca3af;
	}

	.visibility-btn:not(.visible):focus {
		background-color: hsl(var(--muted));
	}

	/* Visible state - dark/primary color */
	.visibility-btn.visible :global(svg) {
		color: hsl(var(--foreground));
	}

	/* Indeterminate state - semi-transparent */
	.visibility-btn.indeterminate :global(svg) {
		color: #9ca3af;
	}

	/* Focus ring */
	.visibility-btn:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	.visibility-btn :global(svg) {
		transform: translateX(0.5px);
	}
</style>
