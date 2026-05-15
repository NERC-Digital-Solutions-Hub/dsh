<script lang="ts">
	import AppCard from '$lib/components/app-card/app-card.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section class="apps-container" aria-labelledby="apps-heading">
	<div class="apps-wrapper">
		<div class="apps-header">
			<h1 id="apps-heading">Apps</h1>
		</div>

		<div class="cards-grid">
			{#each data.appsContent.items as app (app.href)}
				<AppCard
					title={app.title}
					description={app.description}
					image={app.image}
					href={app.href}
				/>
			{/each}
		</div>
	</div>
</section>

<style>
	.apps-container {
		width: 100%;
		padding: 1.25rem 1rem 2.5rem;
	}

	.apps-wrapper {
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
	}

	.apps-header {
		margin-bottom: 1.25rem;
	}

	.apps-header h1 {
		margin: 0;
		color: #1a365d;
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1.5rem;
		align-items: stretch;
	}

	@media (min-width: 1024px) {
		.apps-container {
			padding: 1.5rem 2rem 3rem;
		}

		.cards-grid {
			gap: 2rem;
		}
	}
</style>
