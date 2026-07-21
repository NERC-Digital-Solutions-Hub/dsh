<script lang="ts">
	import UprnChat from '$lib/Components/Chat/Chat.svelte';
	import Spinner from '$lib/Components/shadcn/spinner/spinner.svelte';
	import type { ServiceHealthController } from '$lib/Services/ServiceHealthController.svelte';
	import type { AppTabState } from '$lib/Types/Chatbot.types';
	import type { AiUprnChatbotEndpoints } from '$lib/Types/Chatbot.types';
	import type { ChatbotConfig } from '$lib/Types/Configuration.types';
	import { cn } from '$lib/utils';

	type Props = {
		class?: string;
		health: ServiceHealthController | null;
		chatbotConfig: ChatbotConfig | null;
		endpoints?: AiUprnChatbotEndpoints;
		getTabState: () => Promise<AppTabState>;
	};

	const { class: className, health, chatbotConfig, endpoints, getTabState }: Props = $props();
</script>

<div class={cn('h-full', className)}>
	{#if !health || health.isLoading}
		<div class="flex h-full w-full items-center justify-center">
			<Spinner class="size-10" />
		</div>
	{:else if !health.isAccessible || health.error}
		<p class="p-4 text-center text-sm text-muted-foreground">
			AI UPRN Chatbot service is not available.
		</p>
	{:else if chatbotConfig && endpoints}
		<UprnChat {chatbotConfig} {endpoints} {getTabState} />
	{/if}
</div>
