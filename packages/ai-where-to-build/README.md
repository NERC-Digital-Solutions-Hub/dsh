# @dsh/ai-where-to-build

`@dsh/ai-where-to-build` is an ArcGIS-based planning and analysis app for identifying and assessing potential development sites. It combines an interactive map, layer controls, basemap controls, and analysis tools that can clip, merge, buffer, and query spatial layers.

The hub mounts this package at `/apps/ai-where-to-build`.

## What It Provides

- `AiWhereToBuildApp`, the main Svelte component exported from `src/lib/index.ts`.
- Interactive ArcGIS map view.
- Sidebar widgets for layers, basemaps, and analysis.
- Spatial analysis tools under `src/lib/tools/map`.
- Stores for map interaction and area selection state.
- Static analysis settings under `static/config/apps/ai-where-to-build/config.json`.

## External Dependencies

- ArcGIS Maps SDK for JavaScript through `@arcgis/core` and `@arcgis/map-components`.
- ArcGIS REST packages for portal and feature-service interactions.
- ArcGIS Online web map item referenced by the app map component:
  - Item ID: `331ba640fe6c4fa5b4c3d025160c2ec5`
- ArcGIS feature layers used by the map and analysis settings.

This package does not currently define a bespoke DSH HTTP API endpoint in its static config. Most external data access is through ArcGIS web maps, layers, and feature queries.

## Configuration

Analysis settings live in:

```txt
static/config/apps/ai-where-to-build/config.json
```

When running inside the hub, this config is copied into `hub/static/config/apps/ai-where-to-build/config.json`.

## Useful Commands

```sh
pnpm --filter @dsh/ai-where-to-build dev
pnpm --filter @dsh/ai-where-to-build package
pnpm --filter @dsh/ai-where-to-build build
pnpm --filter @dsh/ai-where-to-build lint
```
