<script lang="ts">
	import * as Alert from '$lib/Components/shadcn/alert/index.js';
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'disclaimer' }>;
	};

	let { content }: Props = $props();
</script>

<Alert.Root>
	<AlertCircleIcon />
	<Alert.Title>Disclaimer</Alert.Title>
	<Alert.Description>{content.text}</Alert.Description>
</Alert.Root>
