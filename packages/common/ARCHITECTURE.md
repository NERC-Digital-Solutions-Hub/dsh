# Svelte 5 Architecture Guidelines

This document defines architectural conventions for Svelte 5 projects. It is intended for developers and AI coding agents working in a shared codebase. The goal is to keep components small, predictable, reusable, accessible, and easy to style from the outside.

These guidelines are generic and should be adapted only when a project has stronger local conventions.

---

## 1. Core Principles

### 1.1 Preserve Behaviour First

Refactors and feature work must preserve existing behaviour unless the task explicitly asks for a behaviour change.

Before making changes, identify:

- What the component currently renders.
- Which props, events, callbacks, snippets, or context values it uses.
- Which state it owns.
- Which parent components depend on it.
- Whether it affects routing, persistence, API calls, accessibility, or visual layout.

When in doubt, make the smallest safe change.

### 1.2 Small Components, Clear Responsibility

Components should have one main responsibility.

Extract a child component when a section of markup:

- Has a clear name or concept.
- Is repeated.
- Has its own local state.
- Has complex conditional rendering.
- Makes the parent difficult to scan.
- Mixes unrelated responsibilities in a single file.
- Would be useful in another page, panel, modal, or flow.

Do not extract tiny one-off fragments if the extraction makes the code harder to follow.

Good component names describe responsibility, not implementation details:

```txt
Good: SearchResultsList, DownloadStatusBadge, UserProfileCard
Avoid: BlueBox, LeftSection, DivWrapper, NewComponent
```

### 1.3 Parent Owns Layout, Child Owns Content

This is one of the most important rules.

```txt
Parent owns: layout, positioning, available size, spacing around children, grid/flex placement, page-level responsiveness, and scroll-region ownership.

Child owns: rendered content, internal structure, behaviour, accessibility, variants, and intrinsic visual styling.
```

Feature components should not usually decide their own outer size or position. They should be reusable in different contexts such as tabs, sidebars, cards, dialogs, split panes, and full-page layouts.

Avoid hardcoding outer layout in feature components:

```svelte
<!-- Avoid inside ordinary feature components -->
<div class="h-full w-full max-w-4xl mx-auto p-6 absolute inset-0 overflow-auto">
  ...
</div>
```

Prefer parent-controlled layout:

```svelte
<!-- Parent.svelte -->
<div class="grid h-full min-h-0 grid-cols-[20rem_1fr] gap-4">
  <Sidebar class="min-h-0" />
  <MainPanel class="min-h-0 overflow-hidden rounded-lg border" />
</div>
```

```svelte
<!-- MainPanel.svelte -->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    class: className = '',
    ...rest
  }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<section class={className} {...rest}>
  <!-- component content -->
</section>
```

Exceptions are allowed for layout primitives and intrinsically sized components:

- `Button`, `Badge`, `Avatar`, `Icon`, `Spinner`.
- `DialogContent`, `PopoverContent`, `TooltipContent`.
- `Sidebar`, `SplitPane`, `ResizablePanel`, `AppShell`.
- Third-party wrappers that require a sized internal container, such as maps, charts, editors, or canvases.

Even exceptions should expose a `class` or equivalent styling hook where practical.

---

## 2. Project Structure

Use a structure that separates application shell, features, reusable UI, services, stores, and shared types.

Recommended structure:

```txt
src/
  lib/
    components/
      ui/                  # design-system primitives
      layout/              # app shell, panels, split views, page layout
      common/              # reusable non-domain components
    features/
      feature-name/
        components/        # feature-specific components
        services/          # feature-specific business/API logic
        stores/            # feature-specific state
        types.ts
        utils.ts
        index.ts
    services/              # app-wide service clients or adapters
    stores/                # app-wide state only
    types/                 # shared domain/application types
    utils/                 # framework-agnostic helpers
    hooks/                 # reusable Svelte logic modules
    config/                # app configuration and constants
  routes/                  # SvelteKit routing only
```

Routes should remain thin. Prefer moving substantial UI and business logic into `src/lib`.

A route should usually:

- Load route-level data.
- Compose feature components.
- Handle route-specific layout.
- Avoid containing large domain logic.

---

## 3. Component Design

### 3.1 Component Categories

Use these categories when deciding where a component belongs.

#### UI primitives

Small, reusable, mostly domain-neutral components.

Examples:

- `Button`
- `Input`
- `Dialog`
- `Badge`
- `EmptyState`
- `IconButton`
- `SectionHeader`

They may own intrinsic sizing, variants, and accessibility behaviour.

#### Layout components

Components whose purpose is layout.

Examples:

- `AppShell`
- `SidebarLayout`
- `SplitPane`
- `PanelGroup`
- `PageHeader`

They may own grid, flex, width, height, positioning, and scroll boundaries.

#### Feature components

Components tied to a product feature or domain concept.

Examples:

- `DownloadList`
- `SearchResultsPanel`
- `MapLayerControls`
- `UserPermissionsEditor`

They should avoid owning their outer layout. They should expose styling hooks and let parents decide placement.

#### Controller components

Components or modules that coordinate data fetching, state, and side effects.

Examples:

- `FeatureProvider.svelte`
- `FeatureController.svelte`
- `useFeatureController.svelte.ts`

Keep these separate from presentational components where possible.

### 3.2 Recommended Component Shape

For a reusable Svelte 5 component:

```svelte
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  type Props = HTMLAttributes<HTMLDivElement> & {
    title: string;
    description?: string;
    isLoading?: boolean;
  };

  let {
    title,
    description,
    isLoading = false,
    class: className = '',
    ...rest
  }: Props = $props();
</script>

<section class={className} {...rest}>
  <header>
    <h2>{title}</h2>
    {#if description}
      <p>{description}</p>
    {/if}
  </header>

  {#if isLoading}
    <p>Loading...</p>
  {:else}
    <slot />
  {/if}
</section>
```

Use the project's established convention if it already uses `className`, `containerClass`, variants, or rest props differently.

### 3.3 Props

Props should be explicit, typed, and stable.

Prefer:

```svelte
<script lang="ts">
  type Props = {
    userId: string;
    isSelected?: boolean;
    onSelect?: (id: string) => void;
  };

  let { userId, isSelected = false, onSelect }: Props = $props();
</script>
```

Avoid unclear prop bags:

```svelte
<script lang="ts">
  let { data, options, config, stuff } = $props();
</script>
```

Use prop objects only when they represent a clear domain model.

### 3.4 Events and Callbacks

Prefer explicit callback props for component actions.

```svelte
<script lang="ts">
  type Props = {
    itemId: string;
    onRemove?: (itemId: string) => void;
  };

  let { itemId, onRemove }: Props = $props();
</script>

<button type="button" onclick={() => onRemove?.(itemId)}>
  Remove
</button>
```

Use two-way binding sparingly. Svelte supports bindable props, but default data flow should be parent-to-child. Use `$bindable` only when two-way ownership is genuinely simpler and documented.

### 3.5 Snippets and Composition

Use snippets for structured composition when a component needs custom render regions.

Example use cases:

- Custom list item rendering.
- Table row actions.
- Header/footer slots.
- Empty states.

Prefer named snippets over deeply nested prop configuration when markup customisation is needed.

---

## 4. State Management

### 4.1 Local State

Use local `$state` for state that belongs only to one component.

Examples:

- A dropdown's open state.
- A temporary input value.
- A local loading flag.
- UI-only hover or selection state.

```svelte
<script lang="ts">
  let isOpen = $state(false);
</script>
```

### 4.2 Derived State

Use `$derived` for values calculated from state or props.

Derived state must be side-effect free.

Good:

```svelte
<script lang="ts">
  let { items } = $props();
  let selectedItems = $derived(items.filter((item) => item.selected));
</script>
```

Avoid side effects inside `$derived`:

```svelte
<script lang="ts">
  // Avoid
  let result = $derived.by(() => {
    fetch('/api/items');
    return items.length;
  });
</script>
```

### 4.3 Effects

Use `$effect` for side effects that react to state changes.

Examples:

- Subscribing and unsubscribing.
- Syncing to local storage.
- Triggering browser APIs.
- Updating third-party widgets after DOM updates.

Always clean up effects when needed:

```svelte
<script lang="ts">
  let { id } = $props();

  $effect(() => {
    const controller = new AbortController();

    fetch(`/api/items/${id}`, { signal: controller.signal });

    return () => controller.abort();
  });
</script>
```

Avoid using `$effect` as a general replacement for normal functions. If an action happens because the user clicked a button, prefer an explicit event handler.

### 4.4 Shared State

Move state out of a component when:

- Multiple unrelated components need it.
- It persists across routes.
- It is part of a feature workflow.
- It coordinates API calls or domain logic.
- The component is becoming an orchestration layer.

Prefer feature-local stores before global stores.

```txt
Good: src/lib/features/downloads/stores/downloadsStore.svelte.ts
Avoid: putting all feature state into one global app store
```

### 4.5 Context

Use context for dependency injection or avoiding deep prop drilling.

Good uses:

- Theme or design-system configuration.
- Feature controllers.
- Service clients.
- Form state shared by nested fields.
- Table/list context shared by child rows.

Avoid context for values that would be clearer as direct props.

Document context contracts clearly.

---

## 5. Services, Data Fetching, and Side Effects

### 5.1 Separate Data Access from UI

Components should not contain large API clients or transformation pipelines.

Prefer:

```txt
features/orders/
  services/ordersApi.ts
  services/ordersTransformer.ts
  stores/ordersStore.svelte.ts
  components/OrdersPanel.svelte
```

The component should call a small, clear interface rather than build URLs, parse complex responses, and transform domain data inline.

### 5.2 Keep Business Logic Testable

Move business logic into TypeScript modules when it does not need the DOM.

Good candidates:

- Filtering.
- Sorting.
- Grouping.
- Validation.
- Permission checks.
- API response transformation.
- Status mapping.
- Tree/list construction.
- Date and number formatting.

Pure functions are easier to test and safer for agents to refactor.

### 5.3 Async Work

For async workflows:

- Track loading, success, empty, and error states explicitly.
- Avoid hidden retries unless documented.
- Abort stale requests when props change or components unmount.
- Keep polling logic outside presentational components.
- Avoid triggering fetches from `$derived`.

Recommended pattern:

```txt
Component -> controller/hook -> service -> API/client
```

---

## 6. Styling and Tailwind

### 6.1 Styling Ownership

Styling should follow the same ownership rule as layout.

Parent controls:

- Outer width and height.
- Page and section spacing.
- Grid/flex placement.
- Positioning.
- Scroll containers.
- Responsive layout.

Child controls:

- Internal typography.
- Internal gaps between its own elements.
- Visual variants.
- States such as selected, disabled, error, loading.
- Accessibility-related styles.

### 6.2 Tailwind First, Scoped CSS When Needed

Prefer Tailwind utilities for ordinary styling:

- Layout.
- Spacing.
- Typography.
- Borders.
- Backgrounds.
- Responsive behaviour.
- Hover/focus/disabled states.

Use scoped CSS for:

- Complex selectors.
- Third-party component overrides.
- Animations that are hard to express cleanly in utilities.
- Styles requiring pseudo-elements or uncommon CSS features.
- Repeated styling that is clearer as a component variant.

Avoid defining the same property in both Tailwind classes and scoped CSS.

### 6.3 Avoid Hardcoded Design Values

Prefer design tokens, CSS variables, Tailwind theme values, or shared variants.

Avoid repeated hardcoded values like:

```css
color: #374151;
background: #f9fafb;
border-color: #e5e7eb;
```

Prefer semantic values:

```svelte
<div class="border-border bg-background text-foreground">
  ...
</div>
```

Use the project's token system if one exists.

### 6.4 Class Hooks

Reusable components should usually expose a `class` hook.

```svelte
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    class: className = '',
    ...rest
  }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div class={className} {...rest}>
  ...
</div>
```

If a component has multiple important regions, expose named class hooks only when needed:

```ts
type Props = {
  class?: string;
  headerClass?: string;
  bodyClass?: string;
  footerClass?: string;
};
```

Do not overdo region class props. If many are needed, the component may be too rigid or too large.

### 6.5 Scroll Ownership

Only one layer should own scrolling for a region.

Avoid nested accidental scroll containers:

```svelte
<!-- Usually problematic -->
<div class="h-full overflow-auto">
  <Child class="h-full overflow-auto" />
</div>
```

Prefer making the parent decide:

```svelte
<div class="min-h-0 overflow-auto">
  <Child />
</div>
```

Child components may own internal scrolling only when they are explicitly scrollable widgets, such as code editors, virtualised lists, maps, or chat message lists.

---

## 7. Accessibility

Accessibility is part of component architecture, not a final polish step.

### 7.1 Use Semantic Elements

Prefer semantic HTML before ARIA.

Use:

- `button` for actions.
- `a` for navigation.
- `label` for form labels.
- `fieldset` and `legend` for grouped form controls.
- `header`, `main`, `section`, `nav`, and `aside` when meaningful.

Avoid clickable `div`s and `span`s.

### 7.2 Keyboard Support

Interactive components must work with keyboard navigation.

Check:

- Focus order.
- `Enter` and `Space` behaviour for buttons/custom controls.
- Escape behaviour for dialogs/popovers where appropriate.
- Visible focus states.
- Disabled state semantics.

### 7.3 ARIA Labels

Icon-only buttons must have accessible names.

```svelte
<button type="button" aria-label="Remove item" onclick={removeItem}>
  <XIcon aria-hidden="true" />
</button>
```

Do not rely on tooltips as the only accessible label.

### 7.4 Avoid Suppressing A11y Warnings

Do not add `svelte-ignore` accessibility comments unless there is no reasonable semantic alternative. If suppression is necessary, document why.

---

## 8. Documentation

### 8.1 Component Documentation

Reusable components should document:

- Purpose.
- Main props.
- Styling ownership.
- Whether the parent or child controls size.
- Important accessibility behaviour.
- Any non-obvious side effects.

Example:

```svelte
<!--
  SearchResultsPanel

  Displays search results and empty/loading/error states.

  Layout ownership:
  - Parent controls outer size, position, and scroll region.
  - This component controls internal result spacing and state rendering.
-->
```

### 8.2 Feature Documentation

Each complex feature folder should include a short `README.md` or top-level comment explaining:

- What the feature does.
- Main components.
- Stores/controllers/services.
- Data flow.
- Extension points.
- Known constraints.

### 8.3 Agent-Facing Documentation

If AI agents will work in the repo, keep an `AGENTS.md` file with:

- Project-specific commands.
- Architecture rules.
- Styling conventions.
- Testing expectations.
- Files or patterns to avoid.
- How to safely add new features.

---

## 9. Testing

### 9.1 Test Pure Logic First

Prioritise tests for code that can break silently:

- Data transformers.
- Permission logic.
- Store transitions.
- Selection logic.
- Filtering and sorting.
- Status mapping.
- Validation.
- API response normalisation.

### 9.2 Component Tests

Component tests are useful for:

- Conditional rendering.
- User interactions.
- Accessibility states.
- Loading/error/empty states.
- Event/callback behaviour.

### 9.3 End-to-End Tests

Use end-to-end tests for critical user flows:

- Login or auth flows.
- Multi-step forms.
- Search flows.
- Checkout/export/download workflows.
- Admin or destructive actions.

### 9.4 Refactoring Safety

Before large refactors:

1. Add or identify tests around the behaviour being changed.
2. Refactor in small batches.
3. Run checks after each batch.
4. Avoid mixing refactors and feature changes in the same commit.

---

## 10. Error Handling and Logging

### 10.1 Error States

User-facing components should represent:

- Loading.
- Empty.
- Success.
- Error.
- Retry, where applicable.

Do not leave errors only in the console.

### 10.2 Logging

Avoid uncontrolled `console.log` usage in production code.

Prefer a small logger abstraction if the app needs debug logging:

```ts
logger.debug('downloads', 'Polling started', { jobId });
logger.warn('downloads', 'Unknown status', { status });
logger.error('downloads', 'Download failed', error);
```

Logs should not expose secrets, tokens, personal data, or sensitive API responses.

---

## 11. Security

### 11.1 Rendering HTML

Avoid `{@html}` unless the content is trusted and sanitised.

If HTML comes from:

- Markdown.
- CMS content.
- User input.
- AI output.
- Remote APIs.

then sanitise it before rendering or restrict the allowed elements and attributes.

Document any intentional `{@html}` use.

### 11.2 Secrets and Config

Do not put secrets in client-side code.

Client-exposed environment variables and config should be treated as public.

### 11.3 External Links

External links opened in a new tab should use:

```svelte
<a href={url} target="_blank" rel="noreferrer noopener">
  Open
</a>
```

---

## 12. Performance

### 12.1 Avoid Unnecessary Work in Components

Move expensive calculations to derived values, memoised helpers, workers, or services where appropriate.

Avoid recalculating large lists directly in markup.

### 12.2 Large Lists

For large lists:

- Filter and sort outside the item markup.
- Use stable keys in `{#each}` blocks.
- Consider virtualisation if rendering is slow.
- Avoid deeply nested reactive work per row.

### 12.3 Third-Party Widgets

For maps, charts, editors, and other imperative widgets:

- Initialise once when possible.
- Update incrementally when props change.
- Clean up on unmount.
- Keep widget-specific logic in a wrapper component or service.
- Clearly document whether the parent must provide width/height.

---

## 13. File and Naming Conventions

### 13.1 Component Files

Use PascalCase for components:

```txt
UserProfileCard.svelte
DownloadStatusBadge.svelte
SearchResultsPanel.svelte
```

### 13.2 Utility and Service Files

Use camelCase or kebab-case consistently according to the project convention:

```txt
formatDate.ts
ordersApi.ts
createTreeNodes.ts
```

### 13.3 Stores and Controllers

Make ownership clear:

```txt
useDownloadsController.svelte.ts
downloadsStore.svelte.ts
createSelectionStore.svelte.ts
```

### 13.4 Index Files

Use `index.ts` intentionally. Avoid hiding too much behind barrel exports if it makes dependency ownership unclear.

---

## 14. Refactoring Guidelines for Agents

Agents must keep changes reviewable.

### 14.1 Required Process

Before editing:

1. Inspect related files.
2. Identify current conventions.
3. Identify behaviour that must be preserved.
4. Propose a small batch of changes.
5. Edit only the selected batch.

After editing:

1. Run format, lint, typecheck, tests, and build if available.
2. Fix issues caused by the change.
3. Summarise changed files and rationale.
4. Identify follow-up work without doing unrelated extra refactors.

### 14.2 Batch Size

A good batch is usually:

- One feature folder.
- One large component split into 2-5 smaller files.
- One styling convention cleanup.
- One service extraction.
- One test-focused change.

Avoid changing many unrelated areas at once.

### 14.3 Do Not Mix Concerns

Do not combine these in one change unless explicitly requested:

- Refactor + new feature.
- Styling cleanup + behaviour change.
- Component extraction + API redesign.
- Formatting whole repo + logic changes.
- Dependency upgrades + feature work.

### 14.4 Safe Component Extraction Checklist

When extracting a component:

- Give it a clear responsibility.
- Type its props.
- Preserve accessibility.
- Preserve loading/error/empty states.
- Keep parent-owned layout in the parent.
- Pass callbacks explicitly.
- Keep business logic outside if practical.
- Add class hooks where useful.
- Update imports.
- Run checks.

---

## 15. Code Review Checklist

Use this checklist for feature work and refactors.

### Component boundaries

- [ ] Is each component small enough to understand quickly?
- [ ] Does each component have one main responsibility?
- [ ] Could any repeated or named section be extracted?
- [ ] Are feature components free of page-level layout assumptions?

### Layout and styling

- [ ] Does the parent control external layout and size?
- [ ] Does the child avoid hardcoded outer `w-*`, `h-*`, `max-w-*`, margins, positioning, and scroll ownership?
- [ ] Are Tailwind and scoped CSS not fighting each other?
- [ ] Are design tokens used instead of hardcoded colours?
- [ ] Are class hooks available where useful?

### State and data flow

- [ ] Is `$state` local when state is local?
- [ ] Is `$derived` side-effect free?
- [ ] Are side effects in `$effect` or explicit handlers?
- [ ] Is `$bindable` used sparingly?
- [ ] Is shared state feature-scoped before being made global?

### Accessibility

- [ ] Are semantic elements used?
- [ ] Are icon-only buttons labelled?
- [ ] Is keyboard interaction supported?
- [ ] Are focus states visible?
- [ ] Are accessibility warnings not suppressed without justification?

### Testing and reliability

- [ ] Are pure logic changes tested?
- [ ] Are critical UI states covered?
- [ ] Are async errors handled?
- [ ] Are checks passing?

### Security

- [ ] Is `{@html}` avoided or sanitised?
- [ ] Are secrets kept out of client code?
- [ ] Are external links safe?

---

## 16. Default Rules Summary

Use this summary when making quick decisions.

```txt
1. Preserve behaviour unless explicitly asked to change it.
2. Prefer small, focused components.
3. Parent owns layout, position, size, spacing, responsiveness, and scroll regions.
4. Child owns content, internal structure, behaviour, accessibility, and intrinsic styling.
5. Feature components should expose class hooks and avoid hardcoded outer layout.
6. Use Svelte 5 runes intentionally: $state for local state, $derived for pure derived values, $effect for side effects.
7. Use two-way binding sparingly.
8. Prefer Tailwind utilities for ordinary styling.
9. Use scoped CSS only when it is clearer or necessary.
10. Keep business logic in services, stores, controllers, or pure utilities instead of large components.
11. Test pure logic first.
12. Avoid unsafe {@html}; sanitise remote, user, markdown, CMS, or AI content.
13. Keep refactors small and reviewable.
```
