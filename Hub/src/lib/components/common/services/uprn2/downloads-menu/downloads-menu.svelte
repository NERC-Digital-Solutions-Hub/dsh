<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { downloadsStore } from '$lib/stores/services/uprn2/downloads-store.svelte';
	import CheckCircleIcon from 'lucide-svelte/icons/check-circle';
	import ClipboardIcon from 'lucide-svelte/icons/clipboard';
	import ClipboardCheckIcon from 'lucide-svelte/icons/clipboard-check';
	import LoaderIcon from 'lucide-svelte/icons/loader';
	import XCircleIcon from 'lucide-svelte/icons/x-circle';
	import { toast } from 'svelte-sonner';

	// Track which URLs have been recently copied
	let copiedUrls = $state<Set<string>>(new Set());

	/**
	 * Status configuration for downloads, mapping status to colors, text, and icons.
	 */
	const statusConfig = {
		completed: { color: '#059669', text: 'Completed', icon: CheckCircleIcon },
		'in-progress': { color: '#2563eb', text: 'In Progress', icon: LoaderIcon },
		failed: { color: '#dc2626', text: 'Failed', icon: XCircleIcon },
		pending: { color: '#6b7280', text: 'Pending', icon: Spinner }
	} as const;

	/**
	 * Removes a download from the queue by URL.
	 * @param url - The URL of the download to remove.
	 */
	function removeDownload(url: string) {
		const index = downloadsStore.downloads.findIndex((download) => download.url === url);
		if (index !== -1) {
			downloadsStore.downloads.splice(index, 1);
		}
	}

	/**
	 * Copies the given URL to the clipboard and shows a toast notification.
	 * Temporarily marks the URL as copied for UI feedback.
	 * @param url - The URL to copy.
	 */
	async function copyUrlToClipboard(url: string) {
		try {
			await navigator.clipboard.writeText(url);
			copiedUrls = new Set(copiedUrls).add(url); // Create new Set to trigger reactivity
			toast.success('URL copied to clipboard');

			// Reset the icon after 2 seconds
			setTimeout(() => {
				const newCopiedUrls = new Set(copiedUrls);
				newCopiedUrls.delete(url);
				copiedUrls = newCopiedUrls; // Assign new Set to trigger reactivity
			}, 2000);
		} catch (err) {
			console.error('Failed to copy URL:', err);
			toast.error('Failed to copy URL to clipboard');
		}
	}

	/**
	 * Gets the color associated with a download status.
	 * @param status - The download status.
	 * @returns The color string.
	 */
	function getStatusColor(status: string) {
		return statusConfig[status as keyof typeof statusConfig]?.color ?? statusConfig.pending.color;
	}

	/**
	 * Gets the display text for a download status.
	 * @param status - The download status.
	 * @returns The status text.
	 */
	function getStatusText(status: string) {
		return statusConfig[status as keyof typeof statusConfig]?.text ?? statusConfig.pending.text;
	}

	/**
	 * Gets the icon component for a download status.
	 * @param status - The download status.
	 * @returns The icon component.
	 */
	function getStatusIcon(status: string) {
		return statusConfig[status as keyof typeof statusConfig]?.icon ?? statusConfig.pending.icon;
	}
</script>

<div class="section">
	<h4>Download Queue</h4>
	{#if downloadsStore.downloads.length > 0}
		<ul class="selected-list">
			{#each downloadsStore.downloads as download}
				<li class="download-item">
					<div class="download-info">
						<span class="download-url" title={download.url}>{download.id}</span>
					</div>
					<div class="download-actions">
						<div title={getStatusText(download.status)}>
							<Button
								variant="ghost"
								size="sm"
								class="download-status-btn"
								style="color: {getStatusColor(download.status)}"
								disabled
							>
								{@const StatusIcon = getStatusIcon(download.status)}
								<StatusIcon size={14} class={download.status === 'in-progress' ? 'spinning' : ''} />
							</Button>
						</div>
						<Button
							variant="ghost"
							size="sm"
							class="download-clipboard-btn"
							onclick={() => copyUrlToClipboard(download.url)}
							title="Copy URL to clipboard"
						>
							{#if copiedUrls.has(download.url)}
								<ClipboardCheckIcon size={14} />
							{:else}
								<ClipboardIcon size={14} />
							{/if}
						</Button>
						{#if download.status === 'completed'}
							<Button
								variant="ghost"
								size="sm"
								class="download-action-btn"
								onclick={() => window.open(download.url, '_blank')}
								title="Open download"
							>
								📥
							</Button>
						{/if}
						<Button
							variant="ghost"
							size="sm"
							class="download-remove-btn"
							onclick={() => removeDownload(download.url)}
							title="Remove from queue"
						>
							×
						</Button>
					</div>
				</li>
			{/each}
		</ul>
		<p class="count">{downloadsStore.downloads.length} download(s) in queue</p>
	{:else}
		<p class="no-selection">No downloads in queue</p>
	{/if}
</div>

<style>
	.section {
		margin-bottom: 1.5rem;
	}

	.section:last-child {
		margin-bottom: 0;
	}

	h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 500;
		color: #374151;
	}

	.selected-list {
		list-style: none;
		padding: 0;
		margin: 0 0 0.5rem 0;
	}

	.download-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0.5rem;
		margin-bottom: 0.25rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		color: #374151;
	}

	.download-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.download-url {
		font-weight: 500;
		color: #374151;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	:global(.download-status-btn .spinning) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.download-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	:global(.download-action-btn),
	:global(.download-clipboard-btn),
	:global(.download-status-btn),
	:global(.download-remove-btn) {
		height: 1.5rem;
		width: 1.5rem;
		padding: 0;
		margin-right: -0.5rem;
		font-size: 1rem;
		line-height: 1;
		color: #6b7280;
		transition: color 0.15s ease-in-out;
	}

	:global(.download-status-btn) {
		cursor: default;
		opacity: 1;
	}

	:global(.download-status-btn:disabled) {
		opacity: 1;
		pointer-events: none;
	}

	:global(.download-action-btn:hover) {
		color: #059669;
	}

	:global(.download-clipboard-btn:hover) {
		color: #2563eb;
	}

	:global(.download-clipboard-btn:has(svg)) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.download-remove-btn:hover) {
		color: #ef4444;
	}

	.count {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b7280;
	}

	.no-selection {
		margin: 0;
		font-size: 0.875rem;
		color: #9ca3af;
		font-style: italic;
	}
</style>
