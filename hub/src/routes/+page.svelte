<script lang="ts">
	import IntroductionDialog from '$lib/components/introduction-dialog/introduction-dialog.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

{#if data.homeContent.introduction && data.homeContent.settings.enableIntroductionPopup}
	<IntroductionDialog introduction={data.homeContent.introduction} />
{/if}
<div class="hero-section">
	<h1 class="title">
		<span>{data.homeContent.body.title}</span>
		<span class="version">{data.homeContent.body.version}</span>
	</h1>
	<p class="slogan">
		{data.homeContent.body.description}
	</p>
</div>

<style>
	.hero-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 4rem 2rem;
		min-height: 60vh;
		max-width: 1200px;
		margin: 0 auto;
	}

	.title {
		display: inline-flex;
		align-items: baseline;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: center;
		font-size: 3rem;
		font-weight: 700;
		color: #1a365d;
		margin-bottom: 2rem;
		line-height: 1.2;
		letter-spacing: -0.025em;
	}

	.version {
		font-size: 0.35em;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #718096;
	}

	.slogan {
		font-size: 1.25rem;
		line-height: 1.6;
		color: #4a5568;
		max-width: 800px;
		margin: 0;
		font-weight: 400;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.hero-section {
			padding: 2rem 1rem;
		}

		.title {
			font-size: 2.25rem;
		}

		.slogan {
			font-size: 1.125rem;
		}
	}

	@media (max-width: 480px) {
		.title {
			font-size: 1.875rem;
		}

		.slogan {
			font-size: 1rem;
		}
	}
</style>
