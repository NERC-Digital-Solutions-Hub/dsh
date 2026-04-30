# @dsh/content-api

`@dsh/content-api` is the content boundary for the Digital Solutions Hub apps.
Hub and UPRN call client methods from this package instead of knowing about the
`dsh-content` repository, page manifests, generated manifests, or CSV files.

The current GitHub Pages implementation generates static same-origin endpoint
files before Hub builds:

- `/content-api/hub/introduction.md`
- `/content-api/hub/settings.json`
- `/content-api/uprn/introduction.md`
- `/content-api/uprn/settings.json`
- `/content-api/uprn/custom-renderers.json`
- `/content-api/uprn/treeview-layers.json`

Generation uses `PUBLIC_DSH_ENVIRONMENT` and falls back to `production`.

## Useful Commands

```sh
pnpm --filter @dsh/content-api generate --out ../../hub/static/content-api
pnpm --filter @dsh/content-api check
pnpm --filter @dsh/content-api package
```
