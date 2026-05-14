<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import Download from '@lucide/svelte/icons/download';
	import InfoIcon from '@lucide/svelte/icons/info';
	import RetryIcon from '@lucide/svelte/icons/rotate-ccw';

	import CopyToClipboardButton from '$lib/Components/CopyToClipboardButton/CopyToClipboardButton.svelte';
	import Button from '$lib/Components/shadcn/button/button.svelte';
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';
	import { DownloadStatus, type DownloadEntry } from '$lib/Types/Uprn.types';

	import { getDownloadTooltip } from './downloadMenuUtils';

	/**
	 * Action buttons shown on an individual download row.
	 *
	 * The row owns when this component appears; this component owns the intrinsic
	 * icon button sizing, tooltips, and action labels.
	 */
	type Props = {
		download: DownloadEntry;
		downloadUrl?: string;
		isDownloading: boolean;
		onDownload: () => void;
		onOpenInfo: () => void;
		onRemove: () => void;
		onRetry: () => void;
	};

	const { download, downloadUrl, isDownloading, onDownload, onOpenInfo, onRemove, onRetry }: Props =
		$props();

	const buttonClass =
		'h-6 w-6 p-0 text-base leading-none text-gray-500 transition-colors disabled:opacity-65';
</script>

<Tooltip.Provider disableHoverableContent>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<Button
				variant="ghost"
				size="sm"
				class={`${buttonClass} hover:text-blue-600`}
				onclick={onOpenInfo}
				aria-label="View download details"
			>
				<InfoIcon size={14} />
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>Details</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>

{#if downloadUrl}
	<Tooltip.Provider disableHoverableContent>
		<Tooltip.Root>
			<Tooltip.Trigger>
				<CopyToClipboardButton
					value={downloadUrl}
					class={`${buttonClass} flex items-center justify-center hover:text-blue-600`}
					successMessage="URL copied to clipboard"
					errorMessage="Failed to copy URL to clipboard"
					title=""
					iconSize={14}
				/>
			</Tooltip.Trigger>
			<Tooltip.Content>Copy download URL</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}

{#if downloadUrl && download.status === DownloadStatus.Completed}
	<Tooltip.Provider disableHoverableContent>
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button
					variant="ghost"
					size="sm"
					class={`${buttonClass} hover:text-emerald-600 disabled:cursor-wait`}
					onclick={onDownload}
					disabled={isDownloading}
					aria-label="Download file"
				>
					<span class="relative inline-flex items-center justify-center">
						<Download size={14} />
						{#if download.isDownloaded}
							<span
								class="absolute -top-0.5 -right-1.5 inline-flex size-2 items-center justify-center text-emerald-600"
								aria-hidden="true"
							>
								<CheckIcon size={5} />
							</span>
						{/if}
					</span>
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>{getDownloadTooltip(download, isDownloading)}</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}

{#if download.status === DownloadStatus.Failed}
	<Tooltip.Provider disableHoverableContent>
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button
					variant="ghost"
					size="sm"
					class={`${buttonClass} hover:text-blue-600`}
					onclick={onRetry}
					aria-label="Retry download"
				>
					<RetryIcon size={14} />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>Retry</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}

<Tooltip.Provider disableHoverableContent>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<Button
				variant="ghost"
				size="sm"
				class={`${buttonClass} hover:text-red-500`}
				onclick={onRemove}
				aria-label="Remove from queue"
			>
				x
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content side="right">Remove</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
