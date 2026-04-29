# @dsh/maps-page

`@dsh/maps-page` provides the general map explorer for the Digital Solutions Hub. It gives users an ArcGIS map with a layer list, command search, organisation selection, and commands for adding web maps or layers.

The hub mounts this package at `/maps`.

## What It Provides

- `MapsApp`, the main Svelte component exported from `src/lib/index.ts`.
- Full-screen ArcGIS map view.
- Sidebar layer list and legend support.
- Command search for map actions.
- Commands for selecting an organisation, adding layers, adding web maps, and clearing the map.
- Static organisation and portal config under `static/config/maps/config.json`.

## External Dependencies

- ArcGIS Maps SDK for JavaScript through `@arcgis/core` and `@arcgis/map-components`.
- ArcGIS REST portal and feature-service packages.
- Configured ArcGIS portals and search endpoints:
  - ArcGIS Online: `https://www.arcgis.com`
  - DSH Enterprise: `https://nercdsh.dev.azure.manchester.ac.uk/portal`
  - DSH Enterprise sandbox: `https://base.sandbox.digital-solutions.uk/portal`
  - Organisation-specific ArcGIS search endpoints for UoM AGOL, DSH AGOL, Natural England, and the Met Office.
- ArcGIS map, feature, tile, and vector tile services returned by those portal searches.

## Configuration

Map organisation config lives in:

```txt
static/config/maps/config.json
```

When running inside the hub, this config is copied into `hub/static/config/maps/config.json`.

The package also contains `static/api/maps/*.json` files, which are cached or sample ArcGIS search responses used as local reference data.

## Useful Commands

```sh
pnpm --filter @dsh/maps-page dev
pnpm --filter @dsh/maps-page package
pnpm --filter @dsh/maps-page build
pnpm --filter @dsh/maps-page lint
```
