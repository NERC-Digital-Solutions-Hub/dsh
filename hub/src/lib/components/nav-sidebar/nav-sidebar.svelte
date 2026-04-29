<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import navItems from '$lib/components/nav.json';
	import * as Sidebar from '$lib/components/shadcn/sidebar/index.js';
	import type { NavFolder, NavItem, NavLink } from '$lib/types/nav.types';

	const navigation = navItems as NavItem[];
	const folders = navigation.filter((item): item is NavFolder => item.type === 'folder');
	const links = navigation.filter((item): item is NavLink => item.type === 'link');
	const absoluteUrlPattern = /^[a-z][a-z\d+\-.]*:/i;

	const isExternalHref = (href: string) => absoluteUrlPattern.test(href);

	const resolveHref = (href: string) => {
		if (isExternalHref(href) || href.startsWith('#')) {
			return href;
		}

		return `${base}${href.startsWith('/') ? href : `/${href}`}`;
	};

	const isActive = (href: string, includeDescendants = false) => {
		if (isExternalHref(href) || href.startsWith('#')) {
			return false;
		}

		const resolvedHref = resolveHref(href);

		return (
			page.url.pathname === resolvedHref ||
			(includeDescendants && page.url.pathname.startsWith(`${resolvedHref}/`))
		);
	};
</script>

<Sidebar.Root collapsible="icon">
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg" tooltipContent="Digital Solutions Hub">
					{#snippet child({ props })}
						<a href={`${base}/`} {...props}>
							<img
								src={`${base}/dsh-logo.png`}
								alt="NERC Digital Solutions Hub"
								class="logo"
								decoding="async"
							/>
							<span class="brand-text">Digital Solutions Hub</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		{#each folders as folder (folder.name)}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{folder.name}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each folder.children as navLink (navLink.name)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton isActive={isActive(navLink.href)} tooltipContent={navLink.name}>
									{#snippet child({ props })}
										<a
											href={resolveHref(navLink.href)}
											title={navLink.info ?? navLink.name}
											{...props}
										>
											<span>{navLink.name}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/each}

		{#if links.length > 0}
			<Sidebar.Group>
				<Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each links as link (link.name)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton isActive={isActive(link.href, true)} tooltipContent={link.name}>
									{#snippet child({ props })}
										<a href={resolveHref(link.href)} title={link.info ?? link.name} {...props}>
											<span>{link.name}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/if}
	</Sidebar.Content>

	<Sidebar.Rail />
</Sidebar.Root>

<style>
	.logo {
		height: 32px;
		width: auto;
		flex: 0 0 auto;
	}

	.brand-text {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
