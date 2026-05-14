# @dsh/research-page

`@dsh/research-page` renders research content for the Digital Solutions Hub. It loads markdown through the DSH content manifest, parses article metadata from markdown frontmatter, converts markdown to HTML, and exposes Svelte components for the research landing page and individual article pages.

The hub mounts this package at `/research` and `/research/articles/[title]`.

## What It Provides

- `ResearchPage`, the main research landing-page component.
- `ArticlePage`, the individual article component.
- Server load helpers for research and article routes.
- Manifest-based article discovery and metadata lookup.
- Markdown processing with frontmatter, GitHub-flavoured markdown, raw HTML support, heading links, external links, and Mermaid support.

## External Dependencies

- DSH content site configured by `PUBLIC_DSH_CONTENT_BASE_URL`, falling back to the shared default from `@dsh/content`.
- Content environment configured by `PUBLIC_DSH_ENVIRONMENT`, falling back to the shared default from `@dsh/content`.
- Research content is discovered from the content manifest:
  - `/research` page asset `main`
  - `/research/articles` assets ending in `.article`
  - article metadata frontmatter in each markdown file
- Markdown and diagram processing libraries, including `gray-matter`, `unified`, `remark-*`, `rehype-*`, `mermaid`, and `sql.js`.

## Configuration

The route loaders read the configured content manifest and resolve all markdown URLs from manifest assets. Set `PUBLIC_DSH_CONTENT_BASE_URL` to override the default content site.

## Useful Commands

```sh
pnpm --filter @dsh/research-page dev
pnpm --filter @dsh/research-page package
pnpm --filter @dsh/research-page build
pnpm --filter @dsh/research-page lint
```
