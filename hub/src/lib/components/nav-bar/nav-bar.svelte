<script lang="ts">
	import { base } from '$app/paths';
	import * as NavigationMenu from '$lib/components/shadcn/navigation-menu/index.js';
	import { navigationMenuTriggerStyle } from '$lib/components/shadcn/navigation-menu/navigation-menu-trigger.svelte';
</script>

<nav>
	<a href="{base}/" class="brand">
		<img
			src={`${base}/dsh-logo.png`}
			alt="NERC Digital Solutions Hub"
			class="logo"
			decoding="async"
		/>
	</a>
	<NavigationMenu.Root class="menu-item-container z-20">
		<NavigationMenu.List>
			<NavigationMenu.Item openOnHover={false}>
				<NavigationMenu.Trigger>Catalogues</NavigationMenu.Trigger>
				<NavigationMenu.Content>
					<ul class="apps-menu-dropdown grid w-[300px] gap-4 p-2">
						<li>
							<!-- <NavigationMenu.Link
								class="apps-menu-link"
								href={`${base}/catalogues/dsh-catalogue`}
								title="Explore our data using a traditional approach to search."
							>
								<div class="font-medium">DSH Catalogue</div>
								<div class="apps-menu-description text-muted-foreground">
									Explore our data using a traditional approach to search.
								</div>
							</NavigationMenu.Link>
							<NavigationMenu.Link
								class="apps-menu-link"
								href={`${base}/catalogues/dsh-catalogue-arcgisonline`}
								title="Explore our data using a traditional approach to search."
							>
								<div class="font-medium">DSH Catalogue (ArcGIS Online)</div>
								<div class="apps-menu-description text-muted-foreground">
									Explore our data using a traditional approach to search.
								</div>
							</NavigationMenu.Link> -->
							<NavigationMenu.Link
								class="apps-menu-link"
								href={`${base}/catalogues/ai`}
								title="Explore our data using AI-powered search and discovery tools."
							>
								<div class="font-medium">AI Catalogue</div>
								<div class="apps-menu-description text-muted-foreground">
									Explore our data using AI-powered search and discovery tools.
								</div>
							</NavigationMenu.Link>
						</li>
					</ul>
				</NavigationMenu.Content>
			</NavigationMenu.Item>
			<NavigationMenu.Item openOnHover={false}>
				<NavigationMenu.Trigger>Apps</NavigationMenu.Trigger>
				<NavigationMenu.Content>
					<ul class="apps-menu-dropdown grid w-[300px] gap-4 p-2">
						<li>
							<NavigationMenu.Link
								class="apps-menu-link"
								href={`${base}/apps/uprn`}
								title="Explore Unique Property Reference Numbers (UPRNs) on an interactive map."
							>
								<div class="font-medium">UPRN</div>
								<div class="apps-menu-description text-muted-foreground">
									Explore Unique Property Reference Numbers (UPRNs) on an interactive map.
								</div>
							</NavigationMenu.Link>
							<NavigationMenu.Link
								class="apps-menu-link"
								href={`${base}/apps/climate-just`}
								title="Discover who is vulnerable to climate change and fuel-poverty and why."
							>
								<div class="font-medium">ClimateJust</div>
								<div class="apps-menu-description text-muted-foreground">
									Discover who is vulnerable to climate change and fuel-poverty and why.
								</div>
							</NavigationMenu.Link>
							<NavigationMenu.Link
								class="apps-menu-link"
								href={`${base}/apps/health-and-environment`}
								title="Explore the spatial relationships between a broad set of environmental and health data along with the ability to add your own data for your own use."
							>
								<div class="font-medium">Health and Environment</div>
								<div class="apps-menu-description text-muted-foreground">
									Explore the spatial relationships between a broad set of environmental and health
									data along with the ability to add your own data for your own use.
								</div>
							</NavigationMenu.Link>
							<NavigationMenu.Link
								class="apps-menu-link"
								href={`${base}/apps/where-to-build`}
								title="Identify potential sites for housing and undertake a site analysis based on your choices."
							>
								<div class="font-medium">Where to Build</div>
								<div class="apps-menu-description text-muted-foreground">
									Identify potential sites for housing and undertake a site analysis based on your
									choices.
								</div>
							</NavigationMenu.Link>
							<NavigationMenu.Link
								class="apps-menu-link"
								href={`${base}/apps/ai-where-to-build`}
								title="Identify potential sites for housing and undertake a site analysis based on your choices - AI powered."
							>
								<div class="font-medium">Where to Build (AI)</div>
								<div class="apps-menu-description text-muted-foreground">
									Identify potential sites for housing and undertake a site analysis based on your
									choices - AI powered.
								</div>
							</NavigationMenu.Link>
							<NavigationMenu.Link
								class="apps-menu-link"
								href={`${base}/apps`}
								title="View all apps."
							>
								<div class="font-medium">View All...</div>
							</NavigationMenu.Link>
						</li>
					</ul>
				</NavigationMenu.Content>
			</NavigationMenu.Item>
			<NavigationMenu.Item openOnHover={false}>
				<NavigationMenu.Trigger>Realtime</NavigationMenu.Trigger>
				<NavigationMenu.Content>
					<ul class="grid w-[300px] gap-4 p-2">
						<li>
							<NavigationMenu.Link href={`${base}/realtime/urban-observatory`}>
								<div class="font-medium">NERC Urban Observatory</div>
							</NavigationMenu.Link>
						</li>
					</ul>
				</NavigationMenu.Content>
			</NavigationMenu.Item>
			<NavigationMenu.Item openOnHover={false}>
				<NavigationMenu.Link>
					{#snippet child()}
						<a href={`${base}/maps`} class={navigationMenuTriggerStyle()}>Maps</a>
					{/snippet}
				</NavigationMenu.Link>
			</NavigationMenu.Item>
			<NavigationMenu.Item openOnHover={false}>
				<NavigationMenu.Link>
					{#snippet child()}
						<a href={`${base}/research`} class={navigationMenuTriggerStyle()}>Research</a>
					{/snippet}
				</NavigationMenu.Link>
			</NavigationMenu.Item>
		</NavigationMenu.List>
	</NavigationMenu.Root>
</nav>

<style>
	nav {
		flex: 0 0 auto;
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: #fff;
		border-bottom: 1px solid #e5e7eb;
		z-index: 100;
		position: relative;
		height: var(--header-height, 64px);
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: inherit;
		flex: 0 0 auto;
	}

	.logo {
		height: 32px;
		width: auto;
	}

	.menu-item-container {
		align-items: center;
	}

	.apps-menu-dropdown {
		max-height: calc(100vh - var(--header-height, 64px) - 16px);
		overflow-y: auto;
		overflow-x: hidden;
		overscroll-behavior: contain;
	}

	@media (max-height: 640px) {
		.apps-menu-dropdown {
			gap: 0.5rem;
			max-height: calc(100vh - var(--header-height, 64px) - 12px);
		}

		.apps-menu-description {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border: 0;
		}

		:global(.apps-menu-link:hover) .apps-menu-description,
		:global(.apps-menu-link:focus-within) .apps-menu-description {
			position: static;
			width: auto;
			height: auto;
			padding: 0;
			margin: 0;
			overflow: visible;
			clip: auto;
			white-space: normal;
			border: 0;
		}
	}
</style>
