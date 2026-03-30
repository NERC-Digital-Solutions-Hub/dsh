<script lang="ts">
	type Props = {
		name: string;
	};

	let { name }: Props = $props();
</script>

<div class="flex flex-col gap-0.5 ml-1">
	<div class="text-sm text-foreground">Selected archetype</div>
	<div class="text-sm text-foreground">
		<strong>{name}</strong>
	</div>
</div>
