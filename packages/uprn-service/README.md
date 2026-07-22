# @dsh/uprn-service

`@dsh/uprn-service` provides the UPRN application for the Digital Solutions Hub. It lets users explore Unique Property Reference Numbers on an ArcGIS map, select areas of interest, select data layers, export data, manage download jobs, and interact with an AI chatbot.

The hub mounts this package at `/apps/uprn`.

## What It Provides

- `UprnServiceApp`, the main Svelte component exported from `src/lib/index.ts`.
- ArcGIS web map integration.
- Area-of-interest selection tools.
- Data treeviews for selecting layers, variables, and fields.
- Export flow for combining selected areas and data.
- Download queue/status UI.
- UPRN chatbot panel.
- IndexedDB-backed selection persistence.
- Static app, map, API, and renderer config under `static/config/apps/uprn`.

## External Dependencies

- DSH content site configured by `PUBLIC_DSH_CONTENT_BASE_URL`, falling back to the shared default from `@dsh/content`.
  - Used at build time for app introduction, settings, renderers, and generated CSV config.
- DSH UPRN Download API configured in `static/config/apps/uprn/config.json`:
  - Base URL: `https://dshapitest.xyz/uprn-download-v2/api/v1`
  - Health: `/healthz`
  - Request job: `/submit-job`
  - Job statuses: `/request-job-statuses`
  - Area selection limits: `/area-selection-limits`
  - Fetch download: `/download-job`
- DSH UPRN Chatbot API configured in `static/config/apps/uprn/config.json`:
  - Base URL: `https://dshapitest.xyz/uprn-chatbot`
  - Health: `/healthz`
  - Chat: `/chat`
  - Streaming chat: `/chat_stream`
  - Feedback: `/feedbacks`
- ArcGIS Enterprise portal:
  - `https://nercdsh.dev.azure.manchester.ac.uk/portal`
  - Used to load configured web maps and layers.
- ArcGIS Maps SDK for JavaScript through `@arcgis/core` and `@arcgis/map-components`.
- Browser IndexedDB, via `dexie`, for persisting selections and download state.

## Configuration

Primary app config lives in:

```txt
static/config/apps/uprn/config.json
```

Supporting config is grouped under:

```txt
static/config/apps/uprn/api
static/config/apps/uprn/maps
static/config/apps/uprn/maps/custom-renderers
```

When running inside the hub, this config is copied into `hub/static/config/apps/uprn`.

At build/check time, `scripts/generate-content-modules.ts` combines the local operational config
with DSH content (settings, introduction, renderer catalog, and treeview data). The generated demo
module is written to `src/generated/content/uprn.ts`; it is intentionally outside `src/lib` and is
not part of the published package.

## Architecture

- `Components/App.svelte` is the composition root. App-level overlays, map states, download
  availability, and chatbot availability are extracted under `Components/App`.
- `Services/WebMap` owns web-map JSON normalization, layer construction, GeoParquet hydration,
  layer identity, and deterministic ArcGIS resource cleanup. `WebMapStore` owns source loading and
  lifecycle state.
- `Services/AreaSelection/AreaQueryService.ts` owns area name/code queries. ArcGIS highlight handles
  are owned separately by `AreaHighlightController.svelte.ts`.
- `Persistence/UprnDatabase.ts` defines the unchanged Dexie schemas. Selection and download
  repositories are separate persistence boundaries; `db.ts` remains a compatibility barrel.
- `ExportRequestBuilder` is the pure export payload boundary. `UprnDownloadClient` owns wire calls,
  while `DownloadsController.svelte.ts` owns submission, polling, retries, and status transitions.
- `AiChatbotClient` owns chatbot wire calls and `ChatController.svelte.ts` owns conversation state.
- `MetadataContentController.svelte.ts` owns metadata loading, caching, and object-URL cleanup.
  Renderers are loaded lazily and rich text passes through the shared sanitized Markdown/HTML
  pipeline.

## Useful Commands

```sh
pnpm dev:uprn-service
pnpm --filter @dsh/uprn-service test
pnpm --filter @dsh/uprn-service check
pnpm --filter @dsh/uprn-service package
pnpm --filter @dsh/uprn-service build
pnpm --filter @dsh/uprn-service lint
```
