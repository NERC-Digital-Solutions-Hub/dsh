<!-- src/routes/articles/[slug]/+page.svelte -->
<script lang="ts">
	import ArticlePreviewCard from '$lib/components/article-preview-card/article-preview-card.svelte';
	import type { ArticleMetadata } from '$lib/types/article';
	export let data: {
		html: string;
		frontmatter: Record<string, unknown>;
		articleMetadata: ArticleMetadata[];
	};

	function getLink(metadata: ArticleMetadata): `/research/articles/${string}` {
		return `/research/articles/${metadata.path}`;
	}
</script>

<div>
	<div class="article-container">
		<div class="article-wrapper">
			<article class="prose prose-lg max-w-none">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html data.html}
			</article>
		</div>
	</div>
</div>

<div class="cards-container">
	<div class="cards-grid">
		{#each data.articleMetadata.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) as metadata (metadata.path)}
			{#if !metadata.hidden}
				<ArticlePreviewCard
					title={metadata.title}
					description={metadata.description}
					date={metadata.date}
					image={metadata.image}
					link={getLink(metadata)}
				/>
			{/if}
		{/each}
	</div>
</div>

<style>
	.article-container {
		width: 100%;
		padding: 1.25rem 1rem 0.5rem;
	}

	.article-wrapper {
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
	}

	.article-wrapper article {
		max-width: 58rem;
		margin: 0;
		text-align: left;
	}

	.cards-container {
		width: 100%;
		padding: 1rem 1rem 2.5rem;
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1.5rem;
		max-width: 1400px;
		margin: 0 auto;
		align-items: stretch;
	}

	@media (min-width: 1024px) {
		.article-container,
		.cards-container {
			padding: 1.5rem 2rem 3rem;
		}

		.cards-grid {
			gap: 2rem;
		}
	}
</style>
