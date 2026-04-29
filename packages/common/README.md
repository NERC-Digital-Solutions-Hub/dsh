# @dsh/common

`@dsh/common` is the shared utility package for the Digital Solutions Hub workspace. It contains reusable code that is not tied to a single feature app, with a current focus on markdown and rehype processing.

This package is consumed by the hub and other packages through the pnpm workspace.

## What It Provides

- Shared markdown-to-HTML rendering.
- Rehype plugins for GitHub-style alerts, references, and inline text adjacent to SVG icons.
- Shared styles export through `./styles.css`.
- A small Svelte package surface that can be built and watched like the other workspace packages.

## External Dependencies

This package does not call any external runtime APIs directly.

It relies on npm libraries for local processing, including:

- `unified`
- `remark-parse`
- `remark-gfm`
- `remark-rehype`
- `rehype-stringify`
- `rehype-slug`
- `rehype-autolink-headings`
- `rehype-external-links`
- `unist-util-visit`

## Useful Commands

```sh
pnpm --filter @dsh/common package
pnpm --filter @dsh/common dev:workspace
pnpm --filter @dsh/common build
pnpm --filter @dsh/common lint
```
