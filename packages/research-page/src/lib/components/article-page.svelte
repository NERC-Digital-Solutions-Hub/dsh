<!-- src/routes/articles/[slug]/+page.svelte -->
<script lang="ts">
	import { resolve } from '$app/paths';
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

	function formatDate(value: string): string {
		if (!value.trim()) {
			return '';
		}

		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) {
			return value;
		}

		return new Intl.DateTimeFormat('en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(parsed);
	}

	onMount(() => {
		mermaid.initialize({ startOnLoad: true });
		mermaid.run();
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
				<article class="prose prose-lg max-w-none">
					{@html data.html}
				</article>
			</div>
		</main>

		{#if moreArticles.length}
			<aside class="more-section" aria-labelledby="more-articles-heading">
				<h2 id="more-articles-heading">More</h2>
				<div class="more-list">
					{#each moreArticles as metadata (metadata.path)}
						<a class="more-card" href={resolve(getLink(metadata))}>
							<div class="more-card-media" aria-hidden={!metadata.image}>
								{#if metadata.image}
									<img src={metadata.image} alt={metadata.title} loading="lazy" />
								{:else}
									<div class="more-card-placeholder">Image coming soon</div>
								{/if}
							</div>

							<div class="more-card-body">
								<h3>{metadata.title}</h3>
								<p>{metadata.description}</p>
								{#if formatDate(metadata.date)}
									<time datetime={metadata.date}>{formatDate(metadata.date)}</time>
								{/if}
							</div>
						</a>
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
			color: rgb(17 24 39);
		}

		.more-list {
			display: grid;
			gap: 0.9rem;
		}

		.more-card {
			display: grid;
			grid-template-columns: 5.5rem minmax(0, 1fr);
			gap: 0.85rem;
			min-height: 7rem;
			padding: 0.75rem;
			border: 1px solid rgb(210 214 220);
			border-radius: 0.5rem;
			background: rgb(249 250 251);
			color: inherit;
			text-decoration: none;
			transition:
				box-shadow 0.2s ease,
				transform 0.2s ease,
				border-color 0.2s ease;
		}

		.more-card:hover {
			box-shadow: 0 10px 18px rgb(15 23 42 / 10%);
			transform: translateY(-1px);
			border-color: rgb(160 174 192);
		}

		.more-card-media {
			width: 100%;
			aspect-ratio: 1;
			overflow: hidden;
			border-radius: 0.35rem;
			background: rgb(228 231 235);
		}

		.more-card-media img {
			display: block;
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.more-card-placeholder {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
			padding: 0.5rem;
			background: linear-gradient(135deg, rgb(229 231 235), rgb(243 244 246));
			color: rgb(75 85 99);
			font-size: 0.68rem;
			font-weight: 600;
			line-height: 1.2;
			text-align: center;
		}

		.more-card-body {
			display: flex;
			min-width: 0;
			flex-direction: column;
			gap: 0.35rem;
		}

		.more-card-body h3 {
			margin: 0;
			font-size: 0.92rem;
			line-height: 1.25;
			font-weight: 700;
			color: rgb(17 24 39);
			line-clamp: 2;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
			overflow: hidden;
		}

		.more-card-body p {
			margin: 0;
			color: rgb(75 85 99);
			font-size: 0.78rem;
			line-height: 1.35;
			line-clamp: 2;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
			overflow: hidden;
		}

		.more-card-body time {
			margin-top: auto;
			color: rgb(107 114 128);
			font-size: 0.75rem;
			line-height: 1.2;
		}
	}
</style>
