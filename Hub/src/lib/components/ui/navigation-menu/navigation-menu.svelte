<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import NavigationMenuViewport from './navigation-menu-viewport.svelte';

	let {
		ref = $bindable(null),
		class: className,
		viewport = true,
		children,
		...restProps
	}: NavigationMenuPrimitive.RootProps & {
		viewport?: boolean;
	} = $props();

	function preventHover(event: MouseEvent) {
		event.stopPropagation();
	}
</script>

<NavigationMenuPrimitive.Root
	bind:ref
	data-slot="navigation-menu"
	data-viewport={viewport}
	onpointerenter={preventHover}
	onpointermove={preventHover}
	class={cn(
		'group/navigation-menu relative flex max-w-max flex-1 items-center justify-center',
		className
	)}
	{...restProps}
>
	{@render children?.()}

	{#if viewport}
		<NavigationMenuViewport />
	{/if}
</NavigationMenuPrimitive.Root>

<style>
	/* Disable hover behavior when clickOnly is enabled */
	:global([data-click-only='true'] [data-slot='navigation-menu-trigger']:not([data-state='open'])) {
		pointer-events: auto !important;
	}

	:global([data-click-only='true'] [data-slot='navigation-menu-item']) {
		pointer-events: none;
	}

	:global([data-click-only='true'] [data-slot='navigation-menu-trigger']) {
		pointer-events: auto;
	}

	:global([data-click-only='true'] [data-slot='navigation-menu-content']) {
		pointer-events: auto;
	}
</style>
