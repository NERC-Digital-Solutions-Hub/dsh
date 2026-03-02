<script>
	import { asset } from '$app/paths';
	import IntroductionDialog from '$lib/components/introduction-dialog/introduction-dialog.svelte';
	import { useFetchHomeLocalConfig } from '$lib/hooks/use-fetch-home-local-config.svelte';
	import { useFetchHomeRemoteConfig } from '$lib/hooks/use-fetch-home-remote-config.svelte';
	import { onMount } from 'svelte';

	/** Fetches the home local configuration. */
	const localConfig = useFetchHomeLocalConfig(asset('/config/home/config.json'));

	/** Derived state for fetching the home remote configuration based on the local configuration. */
	const remoteConfig = $derived.by(() => {
		if (!localConfig || !localConfig.content) {
			return null;
		}

		console.log('Local configuration content:', localConfig.content);
		const { baseUrl, configurationPath } = localConfig.content;
		const configUrl = new URL(configurationPath, baseUrl).toString();
		const config = useFetchHomeRemoteConfig(configUrl);
		config.fetch();
		return config;
	});

	/** Derived state for extracting the introduction URL from the remote configuration. */
	const introductionUrl = $derived.by(() => {
		if (!localConfig || !localConfig.content || !remoteConfig || !remoteConfig.content) {
			return null;
		}

		const baseUrl = localConfig.content.baseUrl;
		const introductionUrl = remoteConfig.content.introductionPath;
		console.log('Derived introduction URL:', introductionUrl);
		if (!introductionUrl) {
			return null;
		}

		return new URL(introductionUrl, baseUrl).toString();
	});

	onMount(() => {
		localConfig.fetch();
	});
</script>

{#if introductionUrl}
	<IntroductionDialog {introductionUrl} />
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
