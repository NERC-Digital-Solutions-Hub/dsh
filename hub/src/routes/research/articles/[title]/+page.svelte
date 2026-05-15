<script lang="ts">
	import { ArticlePage, type ArticleMetadata } from '@dsh/research-page';

	export let data: {
		html: string;
		frontmatter: any;
		articleMetadata: ArticleMetadata[];
		currentArticlePath: string;
	};
</script>

<ArticlePage {data} />
