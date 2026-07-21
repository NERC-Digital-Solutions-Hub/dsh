# AGENTS.md

Guidance for AI coding agents working on the UPRN service Svelte repository.

## Project summary

`@dsh/uprn-service` is a SvelteKit/Svelte 5 package that exports the UPRN application as `UprnServiceApp` from `src/lib/index.ts`. The app lets users explore Unique Property Reference Numbers on an ArcGIS web map, select areas of interest, select datasets/variables, export data, monitor download jobs, and use an AI chatbot.

The package is intended to be mounted by the wider DSH hub, with app/config assets under `static/config/apps/uprn` and the public component/styles exported from the package build.

## Tech stack and conventions

- SvelteKit 2 and Svelte 5 runes.
- TypeScript with `strict: true`.
- Tailwind CSS v4 via `@tailwindcss/vite`.
- shadcn-svelte/Bits UI components under `src/lib/Components/shadcn`.
- ArcGIS Maps SDK via `@arcgis/core` and `@arcgis/map-components`.
- IndexedDB persistence via Dexie and repositories under `src/lib/Persistence`; `src/lib/db.ts` is a compatibility barrel.
- Package manager/scripts are pnpm-oriented.
- Formatting uses tabs, single quotes, Prettier, and `prettier-plugin-tailwindcss`.
- ESLint warns on unused variables and explicit `any`; class members must use explicit accessibility modifiers.

Important commands:

```sh
pnpm run check
pnpm run lint
pnpm run build
pnpm run test
```

When running from the monorepo root, prefer the package filter form when available:

```sh
pnpm --filter @dsh/uprn-service check
pnpm --filter @dsh/uprn-service lint
pnpm --filter @dsh/uprn-service build
pnpm --filter @dsh/uprn-service test
```

Vitest unit tests live beside first-party modules as `*.test.ts`. Persistence tests use
`fake-indexeddb`; polling tests use fake timers.

## Repository map

```txt
src/lib/index.ts                         Package entry; exports UprnServiceApp.
src/lib/Components/App.svelte            Main app orchestrator; currently very large.
src/lib/Components                       Feature and UI components.
src/lib/Components/shadcn                shadcn-svelte primitives; treat mostly as generated UI primitives.
src/lib/Components/Treeview              Area/data treeview components and tree search worker.
src/lib/Components/ItemInfoDialog        Metadata dialog and content renderers.
src/lib/Components/UprnMapView           ArcGIS map view component.
src/lib/Components/App                   App-level panels, map state, and overlays.
src/lib/Hooks                            Small Svelte 5 data helpers that remain feature-local.
src/lib/Stores                           Runes-based state containers/classes.
src/lib/Services                         Domain services and provider interfaces.
src/lib/Services/WebMap                  Web-map JSON, layer, GeoParquet, and cleanup boundaries.
src/lib/Services/AreaSelection           Area query and ArcGIS highlight boundaries.
src/lib/Persistence                      Dexie definition plus selection/download repositories.
src/lib/Models                           Domain/treeview model classes and enums.
src/lib/Types                            Shared TypeScript domain/config types.
src/lib/Utilities                        Pure helpers and browser polyfills.
src/lib/db.ts                            Compatibility exports for persistence modules.
src/generated/content                    Local demo content generated at build/check time; not packaged.
src/lib/styles.css                       Package-level styles imported by route CSS and exported package CSS.
src/routes/+page.svelte                  Local demo/app page, including small-screen guard.
src/routes/+layout.svelte                Local layout wrapper.
src/routes/layout.css                    Tailwind/theme/global CSS entry.
src/routes/prose.css                     Markdown/prose rendering styles.
static/config/apps/uprn                  Local app, API, map, and CSV config assets.
```

## Architecture notes

### Main app composition

`src/lib/Components/App.svelte` is the package composition root. It owns props, layout, bindings,
and explicit creation/cleanup of app-runtime controllers. Named app panels and overlays live under
`src/lib/Components/App`; it should not absorb feature rendering or API logic.

When adding features, avoid adding large UI sections or heavy domain logic directly to `App.svelte`. Prefer extracting:

- feature panel components under `src/lib/Components/<FeatureName>`;
- stateful domain logic into `src/lib/Stores` or `src/lib/Services`;
- async fetch/submit logic into `src/lib/Hooks` or `src/lib/Services`;
- pure transformations into `src/lib/Utilities`.

### Configuration flow

The local operational config is read from `static/config/apps/uprn/config.json` by
`scripts/generate-content-modules.ts`. At build/check time it is enriched with DSH content API data
such as settings, introduction markdown, custom renderers, and treeview configuration. The generated
demo module is written to `src/generated/content`, outside the package source boundary.

Static config files include:

- `static/config/apps/uprn/config.json`
- `static/config/apps/uprn/api/*.csv`
- `static/config/apps/uprn/api/*.json`
- `static/config/apps/uprn/maps/*.json`

When changing config-related code, keep the operational local config and remote content enrichment separate. Do not hardcode environment-specific URLs in components.

### Treeview flow

The treeview system is split across:

- `Models/Treeview` for tree node model types.
- `Types/Treeview.types.ts` for config/domain types.
- `Services/*Provider` and `Services/*Controller` for node lookup, visibility, selection, config, and navigation.
- `Stores/TreeviewStore.svelte.ts` and related stores for state.
- `Components/Treeview/Area` and `Components/Treeview/Data` for UI.
- `Components/Treeview/BaseTreeview.svelte` for shared rendering.

Keep area-selection and data-selection behavior separate unless the abstraction is genuinely shared.

### Map flow

`UprnMapView.svelte` owns ArcGIS MapView UI wiring, map widget setup, fallback map loading,
search/legend setup, and interaction mode changes. Native context-menu bridging is isolated in the
map feature. `Services/WebMap` owns JSON parsing, layer creation, GeoParquet replacement, and cleanup.

Be careful with ArcGIS resources:

- clean up handles/listeners/components on destroy;
- avoid creating duplicate map widgets on reactive updates;
- keep DOM-only ArcGIS code guarded so it does not run during SSR;
- use dynamic imports for ArcGIS modules where the existing code does.

### Download/export flow

Export combines selected areas and selected data. The main pieces are:

- `ExportMenu.svelte` and `ExportMenuFooter.svelte` for export review/actions;
- `DownloadsStore.svelte.ts` for reactive local download state;
- `UprnDownloadClient.ts` for API access;
- `DownloadsController.svelte.ts` for submission, polling, retries, and status transitions;
- `ExportRequestBuilder.ts` for pure validation/payload construction;
- `DownloadsMenu.svelte`, `DownloadInfoDialog.svelte`, and `QueueStatus.svelte` for UI;
- Dexie persistence through `Persistence/DownloadRepository.ts`.

When altering downloads, preserve local IDs, external job IDs, status transitions, persisted state, and display information.

### Chatbot flow

The chatbot UI lives under `Components/Chat`. `AiChatbotClient.ts` owns endpoint construction and wire
calls; `ChatController.svelte.ts` owns conversation IDs, sequence numbers, progressive rendering,
feedback, and failures. Rich text is rendered through `Utilities/richText.ts` and `SanitizedHtml`.

Keep chatbot endpoint construction and health checking outside presentational components where possible.

## Component rules for future work

These rules are intentionally strict. They are meant to prevent the repo from accumulating oversized, tightly coupled components.

### 1. Extract smaller components

Extract a new component when a component contains any of the following:

- repeated markup;
- a named UI concept such as a toolbar, panel, list item, status row, empty state, footer, card, dialog section, or form section;
- complex conditional rendering;
- markup mixed with non-trivial business logic;
- a section that would be understandable with its own props and documentation;
- a file that is becoming hard to scan.

Do not extract tiny one-off fragments if extraction makes the code harder to follow.

Prefer colocated feature components:

```txt
src/lib/Components/DownloadsMenu/DownloadStatusRow.svelte
src/lib/Components/ExportMenu/SelectedAreaSummary.svelte
src/lib/Components/Chat/ChatMessageList.svelte
```

Use shared/global component folders only when a component is genuinely reusable across features.

### 2. Parent owns layout, positioning, and size

As a default rule, parent components own:

- width and height;
- margins and outer spacing;
- grid/flex placement;
- absolute/fixed positioning;
- responsive breakpoints;
- page, panel, sidebar, and scroll-region layout;
- `w-*`, `h-*`, `min-w-*`, `max-w-*`, `min-h-*`, `max-h-*`, `m-*`, `p-*`, `flex-*`, `grid-*`, `absolute`, `fixed`, and similar outer layout classes.

Child components should own:

- their internal semantic structure;
- labels, buttons, icons, and internal groups;
- intrinsic styles required for the component to function;
- accessibility attributes;
- minimal internal spacing that is part of the component's design, not the parent layout.

If a child needs external styling, expose a `class` prop and merge it with `cn`:

```svelte
<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		class?: string;
		// other props
	};

	let { class: className }: Props = $props();
</script>

<div class={cn('internal-component-classes', className)}>
	<!-- content -->
</div>
```

For multiple stylable regions, use explicit names such as `headerClass`, `contentClass`, `footerClass`, or `buttonClass`. Do not add vague styling props when a single `class` prop is enough.

### 3. Avoid internally controlled layout in reusable children

Before adding a class to a child component, ask whether the parent should decide it. Avoid hardcoding these in reusable child roots unless intrinsic:

```txt
w-full h-full min-h-0 max-w-* mx-auto p-* m-* flex-1 grid-cols-* absolute fixed inset-* overflow-*
```

Acceptable exceptions:

- icon sizes inside icon components;
- intrinsic media/aspect-ratio internals;
- animation internals;
- accessibility-only styles;
- third-party component wrapper requirements;
- a component whose explicit responsibility is layout, such as `Sidebar.Root`, `SidebarLayout.*`, or a scroll container.

### 4. Keep behavior stable while refactoring

Refactors must preserve:

- user-visible behavior and visual intent;
- existing props/events/snippets/bindings;
- accessibility labels and keyboard behavior;
- ArcGIS map lifecycle behavior;
- IndexedDB data shape and migrations;
- API request/response shapes;
- treeview selection/visibility behavior;
- package exports from `src/lib/index.ts`.

Do not change business logic during a styling/component extraction unless the bug is obvious and documented.

### 5. Prefer explicit props and typed interfaces

Use `type Props = { ... }` in Svelte components and destructure from `$props()`. Document non-obvious props with short comments.

Use Svelte 5 runes consistently in `.svelte` and `.svelte.ts` files:

- `$state` for mutable reactive state;
- `$derived`/`$derived.by` for derived state;
- `$effect` for side effects and lifecycle-style reactions;
- `$bindable` only when two-way binding is part of the component API.

Do not introduce legacy Svelte store patterns unless integrating with existing APIs that require them.

### 6. Documentation is part of the change

When creating or significantly changing a reusable component, add concise documentation. This can be:

- comments above `type Props` for complex props;
- a short component-level comment near the top of the file;
- a README in a feature folder if the feature has several moving parts.

Document:

- purpose;
- key props;
- styling ownership, especially whether the parent controls size/layout;
- important lifecycle/API behavior.

## Styling rules

### Tailwind first

Prefer Tailwind utilities for normal styling, including spacing, layout, typography, color tokens, borders, shadows, and responsive behavior. Use the project's theme tokens such as `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-card`, and `text-primary` where possible.

Use the shared `cn` helper from `src/lib/utils.ts` to merge conditional class names and resolve Tailwind conflicts.

### CSS only when justified

Use component-scoped CSS or global CSS only for:

- third-party/ArcGIS/shadcn selectors that cannot be handled cleanly with Tailwind;
- animations/keyframes;
- complex pseudo-element behavior;
- global theme/prose rules;
- genuinely repeated CSS that would be noisy as utilities.

Avoid defining the same property in both Tailwind classes and scoped CSS. Do not add new global CSS unless the style is genuinely global.

### Existing CSS entry points

- `src/routes/layout.css` imports Tailwind, theme tokens, `@dsh/common/styles.css`, `src/lib/styles.css`, and prose CSS.
- `src/lib/styles.css` includes package-level styles and `@source './Components'` so Tailwind picks up component classes when the package is consumed elsewhere.
- `src/routes/prose.css` and prose-like classes style rendered markdown/content.
- `src/lib/Components/Treeview/treeview-common.css` is treeview-specific shared CSS.

Do not remove `@source './Components'` unless the package build/import strategy has changed and been verified.

### shadcn-svelte components

Treat `src/lib/Components/shadcn` as the UI primitive layer. Avoid broad modifications there unless the change is deliberately intended for every consumer of that primitive.

The repo imports shadcn primitives through paths like:

```ts
import { Button } from '$lib/Components/shadcn/button';
```

The `components.json` aliases use lowercase paths, but the actual directory in this repo is `Components`. Follow the existing import style unless the repo is intentionally normalized.

## State, services, and data rules

- Put reusable stateful domain logic in `src/lib/Stores` or `src/lib/Services`, not inside large components.
- Use interfaces in `src/lib/Services/I*.ts` when multiple components/services depend on behavior rather than implementation.
- Keep API DTOs and shared domain types in `src/lib/Types`.
- Keep model behavior for tree nodes in `src/lib/Models/Treeview`.
- Keep pure transformations in `src/lib/Utilities`.
- Avoid `any`. If unavoidable around third-party APIs, keep the scope tiny and add a short explanation or ESLint disable on the smallest line possible.
- Preserve explicit class member accessibility in TypeScript classes.

### IndexedDB/Dexie rules

When changing persisted state in `src/lib/db.ts`:

- add a new Dexie version rather than mutating old schemas in place;
- write upgrade logic when data must migrate;
- preserve existing object stores and indexes unless a migration clearly removes them;
- consider cache invalidation for transformed config changes.

## Refactoring workflow for agents

Use small, reviewable batches. Do not attempt a whole-repo cleanup in one pass.

Recommended sequence:

1. Inspect the target directory/component and identify responsibilities.
2. Propose a small batch of related changes.
3. Extract components before changing behavior.
4. Move layout/positioning responsibility upward to the parent.
5. Add or improve documentation for new reusable components.
6. Run `pnpm run check` and `pnpm run lint`; run `pnpm run build` for larger changes.
7. Summarize changed files, extracted components, styling ownership changes, validation commands, and remaining follow-up work.

Good first cleanup targets from the current snapshot:

- `src/lib/Components/App.svelte` — split sidebar tab content, app dialogs/toasts, loading/unavailable states, and app layout sections.
- `src/lib/Components/DownloadsMenu/DownloadsMenu.svelte` — extract job rows/cards, empty/error states, status controls, and action groups.
- `src/lib/Components/UprnMapView/UprnMapView.svelte` — separate ArcGIS widget setup, loading UI, and interaction-mode helpers where safe.
- `src/lib/Components/ExportMenu/ExportMenu.svelte` and `ExportMenuFooter.svelte` — extract selected area/data summaries and validation/status sections.
- `src/lib/Components/Chat/Chat.svelte` — extract message list, empty/loading states, feedback wiring, and endpoint-independent UI.
- `src/lib/Components/Sidebar/Sidebar.svelte` — separate resize logic from rendering if adding features.

## Feature implementation checklist

Before opening a PR or handing off a change, verify:

- Components are small enough to scan.
- New reusable UI is in its own `.svelte` file.
- Parent controls outer layout, size, positioning, and responsive behavior.
- Child roots expose `class` when external styling is expected.
- Tailwind is used for normal styling; scoped/global CSS is justified.
- New props and complex behavior are documented.
- No package exports were broken.
- ArcGIS resources/listeners are cleaned up.
- IndexedDB schema changes use a new Dexie version.
- API/config URLs come from config, not hardcoded component logic.
- `pnpm run check` passes.
- `pnpm run lint` passes or any pre-existing failures are clearly identified.
- `pnpm run build` passes for larger or package-boundary changes.

## Things not to do

- Do not add more large conditional UI blocks to `App.svelte`.
- Do not let reusable children hardcode parent layout decisions.
- Do not mix Tailwind and scoped CSS for the same styling responsibility.
- Do not edit generated shadcn primitives for one-off feature styling.
- Do not introduce a new styling system or component library without strong justification.
- Do not delete config, static map files, or IndexedDB persistence paths without tracing their consumers.
- Do not change API payload shapes or treeview node IDs without checking download/export/map impacts.
- Do not rely on visual changes without running type/lint/build validation.
