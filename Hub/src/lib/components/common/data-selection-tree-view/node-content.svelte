<script lang="ts">
	type Props = {
		icon: string;
		name: string;
		depth: number;
		onclick: () => void;
		children?: any;
	};

	const { icon, name, depth, onclick, children }: Props = $props();

	const widthCalc = `calc(100% - ${depth * 1}rem)`;
</script>

<button
	class="mb-1 cursor-pointer rounded-md border border-border/30 bg-card/50 p-2 text-left transition-colors hover:bg-card/70"
	style="width: {widthCalc};"
	{onclick}
>
	<div class="flex w-full items-center justify-between gap-2">
		<div class="pointer-events-none flex min-w-0 flex-1 items-center gap-1">
			<span class="inline-block size-4" aria-hidden="true">
				{@html icon}
			</span>
			<span class="block w-full text-left break-words">{name}</span>
		</div>
		{@render children?.()}
	</div>
</button>
