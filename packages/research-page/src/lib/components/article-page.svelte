<!-- src/routes/articles/[slug]/+page.svelte -->
<script lang="ts">
	import ArticleMoreCard from '$lib/components/article-more-card/article-more-card.svelte';
	import type { ArticleMetadata } from '$lib/types/article';
	import mermaid from 'mermaid';
	import { onMount } from 'svelte';

	export let data: {
		html: string;
		frontmatter: any;
		articleMetadata: ArticleMetadata[];
		currentArticlePath: string;
	};

	$: moreArticles = data.articleMetadata
		.filter((metadata) => !metadata.hidden && metadata.path !== data.currentArticlePath)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	function getLink(metadata: ArticleMetadata): `/research/articles/${string}` {
		return `/research/articles/${metadata.path}`;
	}

	onMount(() => {
		mermaid.initialize({ startOnLoad: false, theme: 'default' });
		void mermaid.run({ querySelector: '.article-wrapper .mermaid' });
	});
</script>

<svelte:head>
	<title>{data?.frontmatter?.title ?? 'Article'}</title>
	{#if data?.frontmatter?.description}
		<meta name="description" content={data?.frontmatter?.description} />
	{/if}
</svelte:head>

<div class="article-container">
	<div class="article-layout">
		<main class="article-main">
			<div class="article-wrapper">
				<article class="prose prose-neutral max-w-none dark:prose-invert">
					{@html data.html}
				</article>
			</div>
		</main>

		{#if moreArticles.length}
			<aside class="more-section" aria-labelledby="more-articles-heading">
				<h2 id="more-articles-heading">More</h2>
				<div class="more-list">
					{#each moreArticles as metadata (metadata.path)}
						<ArticleMoreCard
							title={metadata.title}
							description={metadata.description}
							date={metadata.date}
							image={metadata.image}
							link={getLink(metadata)}
						/>
					{/each}
				</div>
			</aside>
		{/if}
	</div>
</div>

<style>
	.article-container {
		width: 100%;
		padding: 1rem;
	}

	.article-layout {
		width: 100%;
		max-width: 88rem;
		margin: 0 auto;
	}

	.article-main {
		display: flex;
		justify-content: center;
	}

	.article-wrapper {
		width: 100%;
		max-width: 48rem; /* 768px */
	}

	.article-wrapper article {
		width: 100%;
		max-width: 100%;
	}

	:global(.article-wrapper .prose pre.mermaid) {
		background: transparent;
		color: inherit;
		padding: 1rem 0;
		overflow-x: auto;
	}

	:global(.article-wrapper .prose pre.mermaid svg) {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 0 auto;
	}

	.more-section {
		display: none;
	}

	@media (min-width: 1024px) {
		.article-container {
			padding: 1.5rem 2rem 3rem;
		}

		.article-layout {
			display: grid;
			grid-template-columns: minmax(0, 3fr) minmax(16rem, 1fr);
			gap: 2.5rem;
			align-items: start;
		}

		.article-main {
			justify-content: center;
		}

		.article-wrapper {
			max-width: 56rem; /* 896px - wider on desktop */
		}

		.more-section {
			display: block;
			position: sticky;
			top: 1.5rem;
		}

		.more-section h2 {
			margin: 0 0 1rem;
			font-size: 1rem;
			line-height: 1.3;
			font-weight: 700;
		}

		.more-list {
			display: grid;
			gap: 0.9rem;
		}
	}
</style>
