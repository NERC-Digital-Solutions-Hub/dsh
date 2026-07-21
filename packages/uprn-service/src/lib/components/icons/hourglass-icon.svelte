<script lang="ts">
	import Hourglass from '@lucide/svelte/icons/hourglass';
	import { cn } from '$lib/utils';

	type Props = {
		class?: string;
		size?: number;
		speed?: number;
		/** Inline CSS color value, e.g. '#ff0000' or 'rgb(255,0,0)' */
		color?: string;
		/** CSS class that sets `color`, e.g. 'text-red-500' */
		colorClass?: string;
	};

	const { class: className = '', size = 22, speed = 0.6, color, colorClass }: Props = $props();

	const animationDuration = $derived(`${Math.max(0.2, 1 / Math.max(speed, 0.1))}s`);
</script>

<Hourglass
	aria-hidden="true"
	class={cn(
		'inline-block animate-[spin_var(--hourglass-duration)_ease-in-out_infinite]',
		colorClass,
		className
	)}
	style={`--hourglass-duration: ${animationDuration}`}
	{size}
	{color}
/>
