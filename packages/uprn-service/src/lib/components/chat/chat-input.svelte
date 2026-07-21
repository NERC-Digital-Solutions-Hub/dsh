<script lang="ts">
	import { Button } from '$lib/components/shadcn/button';
	import { Input } from '$lib/components/shadcn/input';
	import { ArrowUp } from '@lucide/svelte';
	import { fly } from 'svelte/transition';

	type Props = {
		value?: string;
		disabled?: boolean;
		placeholder?: string;
		onsubmit?: (event: SubmitEvent) => void;
		exampleQuestions?: string[];
	};

	let {
		value = $bindable(''),
		disabled = false,
		placeholder = 'Type a message...',
		onsubmit,
		exampleQuestions = []
	}: Props = $props();

	/** Duration of the fly text animation */
	const flyDuration: number = 350;

	/** Duration to wait before switching to the next example question */
	const waitDuration: number = 3500;

	let inputRef: HTMLInputElement | null = $state(null);
	let isFocused = $state(false);
	let currentIndex = $state(0);

	export function focus() {
		inputRef?.focus();
	}

	const questions = $derived.by(() =>
		exampleQuestions.length > 0 ? exampleQuestions : [placeholder]
	);

	const currentQuestion = $derived.by(() => questions[currentIndex] ?? placeholder);

	const showAnimatedPlaceholder = $derived.by(() => !value.trim() && !isFocused);

	$effect(() => {
		if (questions.length <= 1) return;

		const id = setInterval(() => {
			currentIndex = (currentIndex + 1) % questions.length;
		}, waitDuration);

		return () => clearInterval(id);
	});
</script>

<form {onsubmit} class="p-2">
	<div class="relative w-full">
		<Input
			bind:ref={inputRef}
			bind:value
			class="w-full rounded-full pr-12"
			placeholder=""
			aria-label="Chat input"
			{disabled}
			onfocus={() => (isFocused = true)}
			onblur={() => (isFocused = false)}
		/>

		{#if showAnimatedPlaceholder}
			<div class="placeholder-overlay">
				<div class="placeholder-viewport">
					{#key currentIndex}
						<div
							class="placeholder-item"
							in:fly={{ y: 18, duration: flyDuration, opacity: 0 }}
							out:fly={{ y: -18, duration: flyDuration, opacity: 0 }}
						>
							{currentQuestion}
						</div>
					{/key}
				</div>
			</div>
		{/if}

		<Button
			type="submit"
			variant="default"
			size="icon"
			class="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
			disabled={value.trim() === '' || disabled}
			aria-label="Submit"
		>
			<ArrowUp class="h-4 w-4" aria-hidden="true" />
		</Button>
	</div>
</form>

<style>
	.placeholder-overlay {
		position: absolute;
		left: 1rem;
		right: 3.25rem;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		color: var(--muted-foreground);
	}

	.placeholder-viewport {
		position: relative;
		height: 1.5rem;
		overflow: hidden;
	}

	.placeholder-item {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;

		font: inherit;
		font-size: 0.875rem;
		line-height: 1.25rem;
		font-weight: 400;
		color: var(--foreground);
		opacity: 0.75;
	}
</style>
