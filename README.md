# Digital Solutions Hub

This repository contains the frontend workspace for the NERC Digital Solutions Hub. The hub brings together data discovery, mapping, research content, and interactive applications into a single SvelteKit site.

The repo is organised as a pnpm monorepo. The `hub` app is the main site that users visit, and the packages in `packages/` provide the feature areas that are mounted into the hub.

## Workspace Structure

- `hub` - the main SvelteKit application. It provides the home page, navigation, shared route shell, and routes that load the individual hub features.
- `packages/common` - shared utilities used across packages, including markdown rendering and rehype plugins.
- `packages/ai-catalogue` - an AI-powered catalogue search experience for discovering metadata, filtering by resource type and format, and exploring result archetypes.
- `packages/ai-where-to-build` - an ArcGIS-based planning and analysis app for identifying and assessing potential development sites.
- `packages/maps-page` - a general maps explorer with ArcGIS map search, organisation selection, layer commands, and map controls.
- `packages/research-page` - research content pages and article rendering, including markdown processing and article index support.
- `packages/uprn-service` - the UPRN application for exploring Unique Property Reference Numbers, selecting areas and data layers, exporting data, managing downloads, and using the UPRN chatbot.

## How The Hub Fits Together

The hub imports each package as a local workspace dependency:

- `/catalogues/ai` loads `@dsh/ai-catalogue`
- `/apps/uprn` loads `@dsh/uprn-service`
- `/apps/ai-where-to-build` loads `@dsh/ai-where-to-build`
- `/maps` loads `@dsh/maps-page`
- `/research` loads `@dsh/research-page`

Static configuration for package apps lives in each package under `static/config`. When the hub starts, `hub/scripts/sync-configs.ts` copies those package configs into `hub/static/config` so the integrated site can serve them from one place.

## Getting Started

Install dependencies from the repository root:

```sh
pnpm install
```

Run the full hub locally:

```sh
pnpm dev
```

Useful root commands:

```sh
pnpm build          # build all workspaces
pnpm lint           # lint all workspaces
pnpm test           # run workspace tests
pnpm package:libs   # package all local Svelte libraries
```

For focused development, there are also package-specific scripts such as:

```sh
pnpm dev:uprn-service
pnpm dev:ai-catalogue
```

## Notes For New Contributors

Most feature packages are Svelte libraries with their own preview route, package build, styles export, and static configuration. The hub consumes their exported components rather than duplicating feature code directly in `hub/src/routes`.

When adding a new hub feature, the usual pattern is:

1. Build the feature as a package under `packages/`.
2. Export the package's main Svelte component from `src/lib/index.ts`.
3. Add the package as a workspace dependency of `hub`.
4. Mount the exported component from a route in `hub/src/routes`.
5. Add any required static config under the package's `static/config` directory.
