<script lang="ts">
	import ItemDetailContent from './item-detail-content.svelte';
	import type { CatalogueItemDetail } from '$lib/utils/catalogue-ui';

	type Props = {
		item: CatalogueItemDetail;
	};

	let { item }: Props = $props();
</script>

<ItemDetailContent {item} />
