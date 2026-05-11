# @dsh/content

`@dsh/content` is the content boundary for the Digital Solutions Hub apps.
Hub and UPRN call client methods from this package instead of knowing about the
`dsh-content` repository, page manifests, generated manifests, or CSV files.

The current GitHub Pages implementation generates static same-origin endpoint
files before Hub builds:

- `/content/hub/introduction.md`
- `/content/hub/settings.json`
- `/content/uprn/introduction.md`
- `/content/uprn/settings.json`
- `/content/uprn/custom-renderers.json`
- `/content/uprn/treeview-layers.json`

Generation uses `PUBLIC_DSH_ENVIRONMENT` and falls back to `production`.

## Useful Commands

```sh
pnpm --filter @dsh/content generate --out ../../hub/static/content
pnpm --filter @dsh/content check
pnpm --filter @dsh/content package
```
