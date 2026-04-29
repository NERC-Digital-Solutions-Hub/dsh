<script lang="ts">
	import { base } from '$app/paths';
	import navItems from '$lib/components/nav.json';
	import * as NavigationMenu from '$lib/components/shadcn/navigation-menu/index.js';
	import { navigationMenuTriggerStyle } from '$lib/components/shadcn/navigation-menu/navigation-menu-trigger.svelte';
	import type { NavItem } from '$lib/types/nav.types';

	const navigation = navItems as NavItem[];
	const absoluteUrlPattern = /^[a-z][a-z\d+\-.]*:/i;

	const resolveHref = (href: string) => {
		if (absoluteUrlPattern.test(href) || href.startsWith('#')) {
			return href;
		}

		return `${base}${href.startsWith('/') ? href : `/${href}`}`;
	};
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
			{#each navigation as item}
				<NavigationMenu.Item openOnHover={false}>
					{#if item.type === 'folder'}
						<NavigationMenu.Trigger>{item.name}</NavigationMenu.Trigger>
						<NavigationMenu.Content>
							<ul class="apps-menu-dropdown grid w-[300px] gap-4 p-2">
								<li>
									{#each item.children as child}
										<NavigationMenu.Link
											class="apps-menu-link"
											href={resolveHref(child.href)}
											title={child.info ?? child.name}
										>
											<div class="font-medium">{child.name}</div>
											{#if child.info}
												<div class="apps-menu-description text-muted-foreground">
													{child.info}
												</div>
											{/if}
										</NavigationMenu.Link>
									{/each}
								</li>
							</ul>
						</NavigationMenu.Content>
					{:else}
						<NavigationMenu.Link>
							{#snippet child()}
								<a href={resolveHref(item.href)} class={navigationMenuTriggerStyle()}>
									{item.name}
								</a>
							{/snippet}
						</NavigationMenu.Link>
					{/if}
				</NavigationMenu.Item>
			{/each}
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
		z-index: 40;
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
