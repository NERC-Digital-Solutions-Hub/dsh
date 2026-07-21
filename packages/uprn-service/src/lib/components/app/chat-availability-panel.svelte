<script lang="ts">
	import UprnChat from '$lib/components/chat/chat.svelte';
	import Spinner from '$lib/components/shadcn/spinner/spinner.svelte';
	import type { ServiceHealthController } from '$lib/services/service-health-controller.svelte';
	import type { AppTabState } from '$lib/types/chatbot.types';
	import type { AiUprnChatbotEndpoints } from '$lib/types/chatbot.types';
	import type { ChatbotConfig } from '$lib/types/configuration.types';
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
