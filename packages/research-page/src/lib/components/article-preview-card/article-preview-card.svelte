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
</script>

<a class={`article-link ${className}`.trim()} href={resolve(link)}>
	<Card.Root class="article-card gap-0 py-0">
		<div class="card-media" aria-hidden={!image}>
			{#if image}
				<img src={image} alt={title} loading="lazy" />
			{:else}
				<div class="media-placeholder">
					<span>Image coming soon</span>
				</div>
			{/if}
		</div>

		<Card.Header class="card-body px-4 pt-4 pb-3 sm:px-5">
			<Card.Title class="card-title">{title}</Card.Title>
		</Card.Header>

		<Card.Content class="px-4 pb-3 sm:px-5">
			<p class="card-description">{description}</p>
		</Card.Content>

		<Card.Footer class="card-footer px-4 pb-4 pt-0 sm:px-5">
			<p class="card-date">{date}</p>
		</Card.Footer>
	</Card.Root>
</a>

<style>
	.article-link {
		display: block;
		height: 100%;
		text-decoration: none;
		color: inherit;
	}

	.article-card {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 26rem;
		border: 1px solid rgb(210 214 220);
		border-radius: 0.75rem;
		overflow: hidden;
		background: rgb(249 250 251);
		transition:
			box-shadow 0.2s ease,
			transform 0.2s ease,
			border-color 0.2s ease;
	}

	.article-card:hover {
		box-shadow: 0 14px 24px rgb(15 23 42 / 10%);
		transform: translateY(-2px);
		border-color: rgb(160 174 192);
	}

	.card-media {
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: rgb(228 231 235);
	}

	.card-media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.media-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		padding: 1rem;
		background: linear-gradient(135deg, rgb(229 231 235), rgb(243 244 246));
		color: rgb(75 85 99);
		font-size: 0.9rem;
		font-weight: 600;
		text-align: center;
	}

	.card-body {
		display: grid;
		gap: 0.6rem;
	}

	.card-footer {
		margin-top: auto;
		align-items: flex-end;
	}

	.card-title {
		margin: 0;
		font-size: 1.1rem;
		line-height: 1.35;
		font-weight: 700;
		line-clamp: 2;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-description {
		margin: 0;
		color: rgb(75 85 99);
		line-height: 1.45;
		font-size: 0.95rem;
		line-clamp: 3;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-date {
		margin: 0;
		font-size: 0.88rem;
		color: rgb(107 114 128);
	}
</style>
