<script lang="ts">
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
</script>

<Dialog.Root open={true}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-[9998] bg-black/50" />

		<Dialog.Content
			class="fixed left-1/2 top-1/2 z-[9999] grid -translate-x-1/2 -translate-y-1/2 m-0 p-0 border-none
             !w-[80vw] !max-w-[80vw] max-h-[90vh] min-h-[90vh] overflow-hidden"
		>
			<iframe
				src="https://www.digital-solutions.uk/user-testing/landingPage.html"
				class="rounded-md"
				width="100%"
				height="100%"
				style="border: none;"
				title="External site"
			></iframe>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
