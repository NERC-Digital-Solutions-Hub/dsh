<script lang="ts">
	import { AlertCircleIcon } from '@lucide/svelte';

	import * as Alert from '$lib/components/shadcn/alert/index.js';
	import { cn } from '$lib/utils';

	import { truncateDownloadErrorMessage } from './download-menu-utils';

	type Props = {
		class?: string;
		message: string;
	};

	const { class: className, message }: Props = $props();
</script>

<Alert.Root variant="destructive" class={cn('py-1', className)}>
	<AlertCircleIcon />
	<Alert.Description>{truncateDownloadErrorMessage(message)}</Alert.Description>
</Alert.Root>
