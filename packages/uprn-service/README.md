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
  - Base URL: `https://dshapitest.xyz/uprn-download/api/v1`
  - Health: `/healthz`
  - Request job: `/request-job`
  - Job statuses: `/request-job-statuses`
  - Area selection limits: `/get-area-selection-limits`
  - Fetch download: `/fetch-download`
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

## Useful Commands

```sh
pnpm dev:uprn-service
pnpm --filter @dsh/uprn-service package
pnpm --filter @dsh/uprn-service build
pnpm --filter @dsh/uprn-service lint
```
