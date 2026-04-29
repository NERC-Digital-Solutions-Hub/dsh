# @dsh/research-page

`@dsh/research-page` renders research content for the Digital Solutions Hub. It loads markdown and article metadata from the DSH content repository, converts markdown to HTML, and exposes Svelte components for the research landing page and individual article pages.

The hub mounts this package at `/research` and `/research/articles/[title]`.

## What It Provides

- `ResearchPage`, the main research landing-page component.
- `ArticlePage`, the individual article component.
- Server load helpers for research and article routes.
- Article index loading and metadata lookup.
- Markdown processing with frontmatter, GitHub-flavoured markdown, raw HTML support, heading links, external links, and Mermaid support.
- Static content config under `static/config/content.json`.

## External Dependencies

- GitHub raw content from the `NERC-Digital-Solutions-Hub/dsh-content` repository.
- Content paths are configured by `static/config/content.json`:
  - Organisation: `NERC-Digital-Solutions-Hub`
  - Repo: `dsh-content`
  - Relative path: `pages`
  - Research main page: `pages/research/main.md`
  - Article index: `pages/research/articles/index.txt`
- Markdown and diagram processing libraries, including `gray-matter`, `unified`, `remark-*`, `rehype-*`, `mermaid`, and `sql.js`.

## Configuration

Content config lives in:

```txt
static/config/content.json
```

When running inside the hub, this config is copied into `hub/static/config/content.json`.

The route loaders currently read content from the `dev` branch of the configured GitHub repository.

## Useful Commands

```sh
pnpm --filter @dsh/research-page dev
pnpm --filter @dsh/research-page package
pnpm --filter @dsh/research-page build
pnpm --filter @dsh/research-page lint
```
