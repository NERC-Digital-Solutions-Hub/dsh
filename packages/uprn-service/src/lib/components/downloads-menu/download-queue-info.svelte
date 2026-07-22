<script lang="ts">
	import { ChevronsDown, ChevronsUp } from '@lucide/svelte';

	import * as Alert from '$lib/components/shadcn/alert/index.js';
	import { cn } from '$lib/utils';

	/**
	 * Explains the fast and slow download queues.
	 *
	 * The parent controls outer spacing through `class`; this component owns the
	 * internal two-column alert content.
	 */
	type Props = {
		class?: string;
	};

	const { class: className }: Props = $props();
</script>

<Alert.Root class={cn('py-2.5', className)}>
	<Alert.Description class="w-full">
		<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
			<div class="flex flex-col items-center gap-1 text-center">
				<div class="inline-flex items-center justify-center gap-2 font-semibold text-gray-700">
					<div
						class="inline-flex items-center justify-center rounded-md border border-gray-100 px-1 py-0.5 text-gray-500"
						aria-hidden="true"
					>
						<ChevronsUp class="size-4" />
					</div>
					<span class="leading-tight">Fast queue</span>
				</div>
				<p class="m-0 text-xs leading-snug">
					Few UPRNs and/or few data selections. Jobs will be processed faster, with priority.
				</p>
			</div>
			<div class="flex flex-col items-center gap-1 text-center">
				<div class="inline-flex items-center justify-center gap-2 font-semibold text-gray-700">
					<div
						class="inline-flex items-center justify-center rounded-md border border-gray-100 px-1 py-0.5 text-gray-500"
						aria-hidden="true"
					>
						<ChevronsDown class="size-4" />
					</div>
					<span class="leading-tight">Slow queue</span>
				</div>
				<p class="m-0 text-xs leading-snug">
					Many UPRNs and/or many data selections. Jobs might take longer to be processed.
				</p>
			</div>
		</div>
	</Alert.Description>
</Alert.Root>
