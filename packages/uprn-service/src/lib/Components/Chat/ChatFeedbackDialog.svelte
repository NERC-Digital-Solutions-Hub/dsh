<script lang="ts">
	import * as Dialog from '$lib/Components/shadcn/dialog/index.js';
	import { Button } from '$lib/Components/shadcn/button';
	import { useSubmitAiChatbotFeedback } from '$lib/Hooks/UseSubmitAiChatbotFeedback.svelte';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';

	type Props = {
		isOpen: boolean;
		feedbackUrl: string;
		feedbackOptions: string[];
		sessionId: string | null;
		sequenceNumber: number | null;
		selectedOption?: string | null;
		inputPlaceholder?: string;
	};

	let {
		isOpen = $bindable(false),
		feedbackUrl,
		feedbackOptions,
		sessionId,
		sequenceNumber,
		selectedOption = null,
		inputPlaceholder = 'Share details (optional)'
	}: Props = $props();

	/** State for managing selected predefined feedback option. */
	let selectedFeedbackOption: string | null = $state(null);

	/** State for managing the user's feedback details input. */
	let details: string = $state('');

	/** Derived state for the chatbot feedback submission hook based on the provided feedback URL. */
	const chatbotFeedback = $derived.by(() => useSubmitAiChatbotFeedback(feedbackUrl));

	/** Whether form has enough data to submit feedback. */
	const canSubmit = $derived.by(() => {
		const hasFeedback = Boolean(selectedFeedbackOption || details.trim());
		return hasFeedback && Boolean(sessionId) && Boolean(sequenceNumber);
	});

	$effect(() => {
		if (isOpen) {
			selectedFeedbackOption = selectedOption;
			details = '';
		}
	});

	function toggleOption(option: string): void {
		selectedFeedbackOption = selectedFeedbackOption === option ? null : option;
	}

	async function submitFeedback(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (!sessionId || !sequenceNumber || !canSubmit) {
			return;
		}

		const feedbackText = [selectedFeedbackOption, details.trim()].filter(Boolean).join('\n\n');
		await chatbotFeedback.submit(sessionId, sequenceNumber, feedbackText);

		if (!chatbotFeedback.error) {
			toast.success(chatbotFeedback.content?.message ?? 'Feedback submitted successfully.');
			isOpen = false;
		} else {
			toast.error('Unable to submit feedback. Please try again.');
		}
	}
</script>

<Dialog.Root bind:open={isOpen} onOpenChange={(open: boolean) => (isOpen = open)}>
	<Dialog.Content class="grid w-[400px] max-w-[400px] gap-4 overflow-hidden">
		<Dialog.Header>
			<Dialog.Title>Tell us what went wrong</Dialog.Title>
			<Dialog.Description>
				Select a reason or provide your own details so we can improve responses.
			</Dialog.Description>
		</Dialog.Header>

		<form class="grid gap-4" onsubmit={submitFeedback}>
			<div class="flex flex-wrap gap-2">
				{#each feedbackOptions as option}
					<Button
						type="button"
						variant={selectedFeedbackOption === option ? 'default' : 'outline'}
						size="sm"
						onclick={() => toggleOption(option)}
					>
						{option}
					</Button>
				{/each}
			</div>

			<textarea
				bind:value={details}
				class={cn(
					'border-input bg-background ring-offset-background placeholder:text-muted-foreground shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive min-h-24 w-full rounded-md border px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px]'
				)}
				placeholder={inputPlaceholder}
			></textarea>

			{#if chatbotFeedback.error}
				<p class="text-sm text-destructive">Unable to submit feedback. Please try again.</p>
			{/if}

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (isOpen = false)}>Cancel</Button>
				<Button type="submit" disabled={!canSubmit || chatbotFeedback.isLoading}>
					{chatbotFeedback.isLoading ? 'Submitting...' : 'Submit feedback'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
