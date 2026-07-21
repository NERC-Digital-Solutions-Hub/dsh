<script lang="ts">
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';

	import HourglassIcon from '$lib/components/icons/hourglass-icon.svelte';
	import Button from '$lib/components/shadcn/button/button.svelte';
	import * as Tooltip from '$lib/components/shadcn/tooltip/index.js';
	import { DownloadStatus } from '$lib/types/uprn.types';

	type StatusMetadata = {
		color: string;
		iconSize: number;
		text: string;
	};

	type Props = {
		status: DownloadStatus;
	};

	const { status }: Props = $props();
	const metadata = $derived(getStatusMetadata(status));

	function getStatusMetadata(status: DownloadStatus): StatusMetadata {
		switch (status) {
			case DownloadStatus.Completed:
				return { color: '#059669', iconSize: 14, text: 'Completed' };
			case DownloadStatus.InProgress:
				return { color: '#2563eb', iconSize: 14, text: 'In Progress' };
			case DownloadStatus.Failed:
				return { color: '#dc2626', iconSize: 14, text: 'Failed' };
			case DownloadStatus.Queued:
				return { color: '#6b7280', iconSize: 22, text: 'Queued' };
			case DownloadStatus.Submitted:
				return { color: '#6b7280', iconSize: 22, text: 'Submitted' };
			case DownloadStatus.Pending:
			default:
				return { color: '#6b7280', iconSize: 22, text: 'Pending' };
		}
	}
</script>

<span class="inline-flex">
	<Tooltip.Provider disableHoverableContent>
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button
					variant="ghost"
					size="sm"
					class="h-6 w-6 cursor-default p-0 text-base leading-none opacity-100 disabled:pointer-events-none disabled:opacity-100"
					style="color: {metadata.color}"
					disabled
				>
					{#if status === DownloadStatus.Completed}
						<CheckCircleIcon size={metadata.iconSize} color={metadata.color} />
					{:else if status === DownloadStatus.InProgress}
						<LoaderIcon size={metadata.iconSize} color={metadata.color} class="animate-spin" />
					{:else if status === DownloadStatus.Failed}
						<XCircleIcon size={metadata.iconSize} color={metadata.color} />
					{:else}
						<HourglassIcon size={metadata.iconSize} color={metadata.color} />
					{/if}
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p>{metadata.text}</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
</span>
