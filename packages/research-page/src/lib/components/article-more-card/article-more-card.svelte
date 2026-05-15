<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/shadcn/card/index.js';

	type Props = {
		title: string;
		description: string;
		date: string;
		image?: string;
		link: `/research/articles/${string}`;
		class?: string;
	};

	const { title, description, date, image = '', link, class: className = '' }: Props = $props();

	const formattedDate = $derived(formatDate(date));

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
</script>

<a class={`article-more-link ${className}`.trim()} href={resolve(link)}>
	<Card.Root class="article-more-card gap-0 py-0">
		<div class="card-media" aria-hidden={!image}>
			{#if image}
				<img src={image} alt={title} loading="lazy" />
			{:else}
				<div class="media-placeholder">Image coming soon</div>
			{/if}
		</div>

		<div class="card-copy">
			<Card.Header class="card-header px-0">
				<Card.Title class="card-title">{title}</Card.Title>
			</Card.Header>

			<Card.Content class="card-content px-0">
				<p class="card-description">{description}</p>
			</Card.Content>

			{#if formattedDate}
				<Card.Footer class="card-footer px-0">
					<time class="card-date" datetime={date}>{formattedDate}</time>
				</Card.Footer>
			{/if}
		</div>
	</Card.Root>
</a>

<style>
	.article-more-link {
		display: block;
		color: inherit;
		text-decoration: none;
	}

	:global(.article-more-card) {
		display: grid;
		grid-template-columns: 5.5rem minmax(0, 1fr);
		gap: 0.85rem;
		min-height: 7rem;
		padding: 0.75rem;
		border: 1px solid rgb(210 214 220);
		border-radius: 0.5rem;
		background: rgb(249 250 251);
		transition:
			box-shadow 0.2s ease,
			transform 0.2s ease,
			border-color 0.2s ease;
	}

	:global(.article-more-card:hover) {
		box-shadow: 0 10px 18px rgb(15 23 42 / 10%);
		transform: translateY(-1px);
		border-color: rgb(160 174 192);
	}

	.card-media {
		width: 100%;
		aspect-ratio: 1;
		overflow: hidden;
		border-radius: 0.35rem;
		background: rgb(228 231 235);
	}

	.card-media img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.media-placeholder {
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

	.card-copy {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 0.35rem;
	}

	:global(.card-header) {
		display: block;
	}

	:global(.card-title) {
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

	:global(.card-content) {
		display: block;
	}

	.card-description {
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

	:global(.card-footer) {
		margin-top: auto;
		align-items: flex-end;
	}

	.card-date {
		color: rgb(107 114 128);
		font-size: 0.75rem;
		line-height: 1.2;
	}
</style>
