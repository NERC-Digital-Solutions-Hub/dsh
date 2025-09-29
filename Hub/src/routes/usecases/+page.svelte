<script lang="ts">
	import { base } from '$app/paths';
	import Button from '$lib/components/ui/button/button.svelte';
	import CrossIcon from '$lib/assets/cross.svg?raw';
	import HouseIcon from '$lib/assets/house.svg?raw';
</script>

<div class="container">
	<div class="half left-half">
		<Button href={`${base}/usecases/housing`} class="use-case-button">
			<div class="button-content">
				<div class="icon">{@html HouseIcon}</div>
				<span class="text">Housing</span>
			</div>
		</Button>
	</div>

	<div class="half right-half">
		<Button href={`${base}/usecases/health`} class="use-case-button">
			<div class="button-content">
				<div class="icon">{@html CrossIcon}</div>
				<span class="text">Health</span>
			</div>
		</Button>
	</div>
</div>

<style>
	.container {
		display: flex;
		height: 100vh;
		width: 100%;
	}

	.half {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.left-half {
		border-right: 1px solid #e2e8f0;
	}

	:global(.use-case-button) {
		padding: 2rem;
		height: auto;
		min-height: 200px;
		width: 100%;
		max-width: 300px;
	}

	.button-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.icon {
		font-size: 20rem; /* Increased from 4rem to 6rem for bigger icons */
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon :global(svg) {
		width: 6rem;
		height: 6rem;
		display: block;
	}

	.text {
		font-size: 1.25rem;
		font-weight: 600;
	}
</style>
