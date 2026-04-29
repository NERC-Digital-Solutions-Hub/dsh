# @dsh/ai-catalogue

`@dsh/ai-catalogue` provides the AI-powered catalogue search experience for the Digital Solutions Hub. It lets users search catalogue metadata, filter results, choose resource archetypes, sort results, and inspect returned records.

The hub mounts this package at `/catalogues/ai`.

## What It Provides

- `AiCatalogue`, the main Svelte component exported from `src/lib/index.ts`.
- Search UI for catalogue metadata.
- Filters for time span, date range, resource type, format, and archetype.
- Paginated result loading and result sorting.
- Service-unavailable and query-error states for external API failures.
- Static config under `static/config/catalogues/ai/api.json`.

## External Dependencies

- DSH catalogue API configured in `static/config/catalogues/ai/api.json`:
  - Base URL: `https://dshapitest.xyz/catalogue/api/v1`
  - Archetypes: `/archetypes`
  - Metadata query: `/metadata/query`
  - Resource types: `/metadata/resource-types`
  - Formats: `/metadata/formats`
- `@dsh/common` for shared workspace utilities.
- ArcGIS client libraries are present for map-related catalogue UI components and spatial result display.

## Configuration

The package reads its API base URL from:

```txt
static/config/catalogues/ai/api.json
```

When running inside the hub, this config is copied into `hub/static/config/catalogues/ai/api.json` by the hub config sync script.

## Useful Commands

```sh
pnpm dev:ai-catalogue
pnpm --filter @dsh/ai-catalogue package
pnpm --filter @dsh/ai-catalogue build
pnpm --filter @dsh/ai-catalogue lint
```
