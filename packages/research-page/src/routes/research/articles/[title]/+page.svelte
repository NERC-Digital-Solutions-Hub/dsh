<script lang="ts">
	import ArticlePage from '$lib/components/article-page.svelte';
	import type { ArticleMetadata } from '$lib/types/article';

	export let data: {
		html: string;
		frontmatter: any;
		articleMetadata: ArticleMetadata[];
		currentArticlePath: string;
	};
</script>

<ArticlePage {data} />
