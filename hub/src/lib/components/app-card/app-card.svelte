<script lang="ts">
	import { base } from '$app/paths';
	import * as Card from '$lib/components/shadcn/card/index.js';

	type Props = {
		title: string;
		description: string;
		image?: string;
		href: string;
		class?: string;
	};

	const { title, description, image = '', href, class: className = '' }: Props = $props();
	const absoluteUrlPattern = /^[a-z][a-z\d+\-.]*:/i;

	const resolvedHref = $derived(resolveHref(href));

	function resolveHref(value: string): string {
		if (absoluteUrlPattern.test(value) || value.startsWith('#')) {
			return value;
		}

		return `${base}${value.startsWith('/') ? value : `/${value}`}`;
	}
</script>

<a class={`app-link ${className}`.trim()} href={resolvedHref}>
	<Card.Root class="app-card gap-0 py-0">
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

		<Card.Content class="px-4 pb-4 sm:px-5">
			<p class="card-description">{description}</p>
		</Card.Content>
	</Card.Root>
</a>

<style>
	.app-link {
		display: block;
		height: 100%;
		text-decoration: none;
		color: inherit;
	}

	:global(.app-card) {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 23rem;
		border: 1px solid rgb(210 214 220);
		border-radius: 0.75rem;
		overflow: hidden;
		background: rgb(249 250 251);
		transition:
			box-shadow 0.2s ease,
			transform 0.2s ease,
			border-color 0.2s ease;
	}

	:global(.app-card:hover) {
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
		padding: 1rem;
		background: linear-gradient(135deg, rgb(229 231 235), rgb(243 244 246));
		color: rgb(75 85 99);
		font-size: 0.9rem;
		font-weight: 600;
		text-align: center;
	}

	:global(.card-body) {
		display: grid;
		gap: 0.6rem;
	}

	:global(.card-title) {
		display: -webkit-box;
		margin: 0;
		overflow: hidden;
		font-size: 1.1rem;
		font-weight: 700;
		line-height: 1.35;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.card-description {
		display: -webkit-box;
		margin: 0;
		overflow: hidden;
		color: rgb(75 85 99);
		font-size: 0.95rem;
		line-height: 1.45;
		line-clamp: 4;
		-webkit-line-clamp: 4;
		-webkit-box-orient: vertical;
	}
</style>
