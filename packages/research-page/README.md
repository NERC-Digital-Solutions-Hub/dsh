# @dsh/research-page

`@dsh/research-page` renders research content for the Digital Solutions Hub. It loads markdown through the DSH content manifest, parses article metadata from markdown frontmatter, converts markdown to HTML, and exposes Svelte components for the research landing page and individual article pages.

The hub mounts this package at `/research` and `/research/articles/[title]`.

## What It Provides

- `ResearchPage`, the main research landing-page component.
- `ArticlePage`, the individual article component.
- Server load helpers for research and article routes.
- Manifest-based article discovery and metadata lookup.
- Markdown processing with frontmatter, GitHub-flavoured markdown, raw HTML support, heading links, external links, and Mermaid support.
- Static content config under `static/config/content.json`.

## External Dependencies

- DSH content site: `https://nerc-digital-solutions-hub.github.io/dsh-content-temp/`.
- Content manifest base URL, optional asset mirror base URL, and environment are configured by `static/config/content.json`.
- Research content is discovered from the content manifest:
  - `/research` page asset `main`
  - `/research/articles` assets ending in `.article`
  - article metadata frontmatter in each markdown file
- Markdown and diagram processing libraries, including `gray-matter`, `unified`, `remark-*`, `rehype-*`, `mermaid`, and `sql.js`.

## Configuration

Content config lives in:

```txt
static/config/content.json
```

When running inside the hub, this config is copied into `hub/static/config/content.json`.

The route loaders read the configured content manifest and resolve all markdown URLs from manifest assets.

## Useful Commands

```sh
pnpm --filter @dsh/research-page dev
pnpm --filter @dsh/research-page package
pnpm --filter @dsh/research-page build
pnpm --filter @dsh/research-page lint
```
