<script lang="ts">
	import * as Alert from '$lib/components/shadcn/alert/index.js';
	import type { MetadataResolvedContent } from '$lib/types/metadata.types';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'disclaimer' }>;
	};

	let { content }: Props = $props();
</script>

<Alert.Root>
	<AlertCircleIcon />
	<Alert.Description>{content.text}</Alert.Description>
</Alert.Root>
