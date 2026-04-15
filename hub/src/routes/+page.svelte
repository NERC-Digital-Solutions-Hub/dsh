<script lang="ts">
	import { asset } from '$app/paths';
	import IntroductionDialog from '$lib/components/introduction-dialog/introduction-dialog.svelte';
	import { useFetchHomeIntroductionMarkdown } from '$lib/hooks/use-fetch-home-introduction-markdown.svelte';
	import { useFetchHomeLocalConfig } from '$lib/hooks/use-fetch-home-local-config.svelte';
	import { useFetchRootManifest } from '$lib/hooks/use-fetch-root-manifest.svelte';
	import { useFetchSiteSettings } from '$lib/hooks/use-fetch-site-settings.svelte';
	import { onMount } from 'svelte';
	import { SvelteURL } from 'svelte/reactivity';

	/** Fetches the home local configuration. */
	const localConfig = useFetchHomeLocalConfig(asset('/config/home/config.json'));

	/** Fetches the root manifest, which contains the URLs for the introduction markdown and site settings. */
	const fetchRootManifest: ReturnType<typeof useFetchRootManifest> | null = $derived.by(() => {
		if (!localConfig || !localConfig.content) {
			return null;
		}

		const hook = useFetchRootManifest(localConfig.content);
		hook.fetch();
		return hook;
	});

	/** Derived state for extracting the introduction URL from the remote configuration. */
	const fetchIntroduction = $derived.by(() => {
		if (!fetchRootManifest || !fetchRootManifest.content) {
			return null;
		}

		const url = new SvelteURL(
			'pages/' + fetchRootManifest.content.files.introduction,
			localConfig?.content?.baseUrl
		).toString();

		const pageBaseUrl = new SvelteURL('pages/', localConfig?.content?.baseUrl).toString();

		const hook = useFetchHomeIntroductionMarkdown(url, pageBaseUrl);
		hook.fetch();
		return hook;
	});

	/** Derived state for fetching the site settings based on the URL from the root manifest. */
	const fetchSiteSettings = $derived.by(() => {
		if (!localConfig || !localConfig.content) {
			return null;
		}

		const url = new SvelteURL(
			'pages/' + fetchRootManifest?.content?.files.settings,
			localConfig.content.baseUrl
		).toString();

		const hook = useFetchSiteSettings(url);
		hook.fetch();
		return hook;
	});

	onMount(() => {
		localConfig.fetch();
	});
</script>

{#if fetchIntroduction?.content && fetchSiteSettings?.content?.enableIntroductionPopup}
	<IntroductionDialog introduction={fetchIntroduction.content} />
{/if}
<div class="hero-section">
	<h1 class="title">NERC Digital Solutions Hub</h1>
	<p class="slogan">
		Developing a Digital Hub and set of Toolkits that exploits environmental and other data (social,
		economic & health) to create innovative digital services that deliver economic, societal and
		environmental benefits across the UK
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
		font-size: 3rem;
		font-weight: 700;
		color: #1a365d;
		margin-bottom: 2rem;
		line-height: 1.2;
		letter-spacing: -0.025em;
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
