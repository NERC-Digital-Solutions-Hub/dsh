<script lang="ts">
	import { onMount } from 'svelte';
	import lottie, { type AnimationItem } from 'lottie-web';
	import { cn } from '$lib/utils';
	import { asset } from '$app/paths';

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

	let container: HTMLDivElement;
	let anim: AnimationItem | null = null;

	onMount(() => {
		anim = lottie.loadAnimation({
			container,
			renderer: 'svg',
			loop: true,
			autoplay: true,
			path: asset('/animations/hourglass.json')
		});

		anim.setSpeed(speed);

		return () => anim?.destroy();
	});

	$effect(() => {
		anim?.setSpeed(speed);
	});
</script>

<div
	bind:this={container}
	class={cn(
		'inline-block hourglass-icon',
		(color || colorClass) && 'hourglass-icon--tinted',
		colorClass,
		className
	)}
	style:width={`${size}px`}
	style:height={`${size}px`}
	style:color
></div>

<style>
	.hourglass-icon--tinted :global(svg [fill]) {
		fill: currentColor;
	}

	.hourglass-icon--tinted :global(svg [stroke]) {
		stroke: currentColor;
	}
</style>
