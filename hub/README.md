# Hub

The `hub` workspace is the main SvelteKit application for the NERC Digital Solutions Hub. It provides the public site shell, home page, navigation, page metadata, and the routes that mount each feature package into one integrated experience.

The hub is intentionally thin: most feature work lives in packages under `../packages`, and this app imports those packages as local workspace dependencies.

## What It Provides

- Home page and site-level layout for the Digital Solutions Hub.
- Navigation for catalogues, apps, realtime pages, maps, and research content.
- Route wrappers for the package apps, including mobile handling where needed.
- Static configuration aggregation for package apps.
- E2E test entry point for the integrated site.

## Local Packages Used By The Hub

- `@dsh/ai-catalogue` is mounted at `/catalogues/ai`.
- `@dsh/ai-where-to-build` is mounted at `/apps/ai-where-to-build`.
- `@dsh/maps-page` is mounted at `/maps`.
- `@dsh/research-page` is mounted at `/research` and `/research/articles/[title]`.
- `@dsh/uprn-service` is mounted at `/apps/uprn`.
- `@dsh/common` provides shared markdown utilities used by hub content rendering.

## Configuration

The hub keeps its own home-page config in `static/config/home/config.json`. Package configuration is copied into `static/config` by `scripts/sync-configs.ts`, which runs from `vite.config.ts` when the hub starts or builds.

The sync keeps the hub's `home` config and refreshes package config from:

- `../packages/ai-catalogue/static/config`
- `../packages/ai-where-to-build/static/config`
- `../packages/maps-page/static/config`
- `../packages/research-page/static/config`
- `../packages/uprn-service/static/config`

## External Dependencies

- DSH content site: `https://nerc-digital-solutions-hub.github.io/dsh-content/` for home, site, and research content manifests.
- GitHub raw content from `NERC-Digital-Solutions-Hub/dsh-content` for research markdown and article metadata.
- DSH catalogue API, UPRN download API, UPRN chatbot API, and ArcGIS portals indirectly through the mounted package configs.
- ArcGIS services used by the maps, UPRN, and AI where-to-build packages.

## Useful Commands

Run these from the repository root unless you are intentionally working only inside `hub`.

```sh
pnpm dev
pnpm --filter hub dev:workspace
pnpm --filter hub build
pnpm --filter hub lint
pnpm --filter hub test
```
