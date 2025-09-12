<script lang="ts">
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import { navigationMenuTriggerStyle } from '$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte';
	import { base } from '$app/paths';
</script>

<nav>
	<a href="/" class="brand">
		<img
			src={`${base}/dsh-logo.png`}
			alt="NERC Digital Solutions Hub"
			class="logo"
			decoding="async"
		/>
	</a>
	<NavigationMenu.Root viewport={false} class="menu-item-container">
		<NavigationMenu.List>
			<NavigationMenu.Item>
				<NavigationMenu.Link>
					{#snippet child()}
						<a href="/" class={navigationMenuTriggerStyle()}>Home</a>
					{/snippet}
				</NavigationMenu.Link>
			</NavigationMenu.Item>
			<NavigationMenu.Item>
				<NavigationMenu.Link>
					{#snippet child()}
						<a href="/catalogue" class={navigationMenuTriggerStyle()}>Catalogue</a>
					{/snippet}
				</NavigationMenu.Link>
			</NavigationMenu.Item>
			<NavigationMenu.Item>
				<NavigationMenu.Trigger>Services</NavigationMenu.Trigger>
				<NavigationMenu.Content>
					<ul class="grid w-[300px] gap-4 p-2">
						<li>
							<NavigationMenu.Link href="#">
								<a href="/services/uprn">
									<div class="font-medium">UPRN</div>
									<div class="text-muted-foreground">
										Explore Unique Property Reference Numbers (UPRNs) on an interactive map.
									</div>
								</a>
							</NavigationMenu.Link>
						</li>
					</ul>
				</NavigationMenu.Content>
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
</style>
